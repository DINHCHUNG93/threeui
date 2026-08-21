import { catalogSlug } from "./catalogPresentation.js";

export const STATIC_ROUTE_PATHS = {
  browse: "/browse",
  installation: "/installation",
  mcp: "/mcp",
  pricing: "/pricing",
};

export const OAUTH_CONSENT_PATH = "/oauth/consent";

export function categoryRouteSegment(category) {
  return category
    .toLowerCase()
    .replace(/\.js\b/g, "-js")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function shaderRoutePath(shader, variantId) {
  const category = categoryRouteSegment(shader.category);
  const slug = catalogSlug(shader);
  return variantId
    ? `/${category}/${encodeURIComponent(slug)}/${encodeURIComponent(variantId)}`
    : `/${category}/${encodeURIComponent(slug)}`;
}

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}

function normalizedPathname(pathname) {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, "") : withLeadingSlash;
}

function findShader(catalog, id) {
  return catalog.find((shader) => shader.id === id)
    ?? catalog.find((shader) => catalogSlug(shader) === id);
}

function resolveShaderSelection(catalog, requestedShader, requestedVariantId) {
  const shader = requestedShader.variantOf
    ? findShader(catalog, requestedShader.variantOf)
    : requestedShader;
  if (!shader || shader.variantOf) return null;

  const variantId = requestedShader.variantOf
    ? requestedShader.variantAliases?.[requestedVariantId] ?? requestedShader.id
    : requestedVariantId;
  if (variantId && !shader.variants?.some((variant) => variant.id === variantId)) return null;

  return {
    page: "shader",
    shader,
    variantId,
    canonicalPath: shaderRoutePath(shader, variantId),
  };
}

function staticRoute(page) {
  return { page, canonicalPath: STATIC_ROUTE_PATHS[page] };
}

function resolveLegacyRoute(searchParams, catalog) {
  const page = searchParams.get("page");
  if (page === "browse" || page === "installation" || page === "mcp" || page === "pricing") {
    return staticRoute(page);
  }

  const requestedId = searchParams.get("shader");
  if (!requestedId) return staticRoute("browse");
  const requestedShader = findShader(catalog, requestedId);
  if (!requestedShader) return null;
  return resolveShaderSelection(catalog, requestedShader, searchParams.get("variant") ?? undefined);
}

export function resolveAppRoute(locationLike, catalog) {
  const pathname = normalizedPathname(locationLike.pathname || "/");
  const searchParams = new URLSearchParams(locationLike.search || "");
  const hasLegacyRoute = searchParams.has("page") || searchParams.has("shader") || searchParams.has("variant");

  if (hasLegacyRoute && (pathname === "/" || pathname === STATIC_ROUTE_PATHS.browse)) {
    const legacyRoute = resolveLegacyRoute(searchParams, catalog);
    if (legacyRoute) return { ...legacyRoute, legacy: true };
  }

  if (pathname === "/" || pathname === STATIC_ROUTE_PATHS.browse) {
    return { ...staticRoute("browse"), legacy: pathname === "/" };
  }
  if (pathname === STATIC_ROUTE_PATHS.installation) return staticRoute("installation");
  if (pathname === STATIC_ROUTE_PATHS.mcp) return staticRoute("mcp");
  if (pathname === STATIC_ROUTE_PATHS.pricing) return staticRoute("pricing");
  if (pathname === OAUTH_CONSENT_PATH) return { page: "oauth-consent", canonicalPath: OAUTH_CONSENT_PATH };

  const segments = pathname.slice(1).split("/").map(decodePathSegment);
  if (segments.length !== 2 && segments.length !== 3) {
    return { page: "not-found", canonicalPath: pathname };
  }

  const requestedShader = findShader(catalog, segments[1]);
  const usesGroupedVariantAlias = segments.length === 3
    && requestedShader?.variantOf
    && requestedShader.variantAliases?.[segments[2]];
  const usesLegacyVariantOrder = segments.length === 3
    && !usesGroupedVariantAlias
    && (!requestedShader || requestedShader.variantOf);
  const legacyRequestedShader = usesLegacyVariantOrder ? findShader(catalog, segments[2]) : undefined;
  const resolvedRequestedShader = usesLegacyVariantOrder ? legacyRequestedShader : requestedShader;
  if (!resolvedRequestedShader) return { page: "not-found", canonicalPath: pathname };

  const selection = resolveShaderSelection(
    catalog,
    resolvedRequestedShader,
    segments.length === 3 ? (usesLegacyVariantOrder ? segments[1] : segments[2]) : undefined,
  );
  if (!selection) return { page: "not-found", canonicalPath: pathname };

  const expectedCategory = categoryRouteSegment(selection.shader.category);
  if (segments[0] !== expectedCategory) return { page: "not-found", canonicalPath: pathname };

  const usesLegacyShaderSlug = segments[1] !== catalogSlug(selection.shader);
  return usesLegacyVariantOrder || usesGroupedVariantAlias || usesLegacyShaderSlug
    ? { ...selection, legacy: true }
    : selection;
}

export function navigationUrl(path, locationLike = window.location) {
  const url = new URL(locationLike.href);
  url.pathname = path;
  url.searchParams.delete("page");
  url.searchParams.delete("shader");
  url.searchParams.delete("variant");
  url.hash = "";
  return url;
}
