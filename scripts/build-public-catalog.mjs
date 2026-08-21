import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const sourceRoot = resolve(process.env.THREEUI_SOURCE_ROOT ?? process.argv[2] ?? "");
if (!process.env.THREEUI_SOURCE_ROOT && !process.argv[2]) {
  throw new Error("Set THREEUI_SOURCE_ROOT or pass the private source snapshot path.");
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = join(projectRoot, "public", "data");
const sourceRegistryPath = join(sourceRoot, "inventory", "source-code.json");
const upgradeUrl = "https://threeui.com/pricing";
const mediaOrigin = "https://threeui.com";
const maxTextBytes = 500_000;
const textExtensions = new Set([".css", ".glsl", ".html", ".js", ".jsx", ".json", ".mjs", ".ts", ".tsx", ".txt"]);

function allowedSourceUrl(value) {
  try {
    const url = new URL(value.replaceAll("&amp;", "&"));
    if (url.hostname === "www.w3.org" && ["/2000/svg", "/1999/xhtml"].includes(url.pathname)) return true;
    if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return true;
    if (url.hostname === "cdn.jsdelivr.net" && /^\/npm\/three@[0-9.]+\//.test(url.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

function externalUrls(text) {
  return [...new Set(text.match(/https?:\/\/[^\s"'<>`)]+/g) ?? [])];
}

function mediaUrl(value, fallback) {
  const path = value || fallback;
  if (/^https:\/\//.test(path)) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, mediaOrigin).toString();
}

function optionalMediaUrl(value) {
  if (!value) return undefined;
  if (/^https:\/\//.test(value)) return value;
  const pathname = value.startsWith("/") ? value.slice(1) : value;
  if (!existsSync(join(sourceRoot, "public", pathname))) return undefined;
  return new URL(`/${pathname}`, mediaOrigin).toString();
}

function rememberAccess(map, id, access) {
  if (!id) return;
  const normalized = access === "pro" ? "pro" : "community";
  if (map.get(id) === "pro") return;
  map.set(id, normalized);
}

function publicMetadata(shader, access, override = {}) {
  const mediaId = String(override.id ?? shader.id);
  const id = String(override.publicId ?? mediaId);
  const sourceVariants = override.variants ?? shader.variants ?? [];
  const primaryVariant = sourceVariants[0];
  const variants = sourceVariants.map((variant) => {
    const variantAccess = shaderModule.getShaderAccess(shader, variant) === "pro" ? "pro" : "community";
    const variantPreview = optionalMediaUrl(variant.preview);
    return {
      id: String(variant.id),
      label: String(variant.label),
      description: String(variant.description || shader.description),
      thumbnail: mediaUrl(variant.thumbnail, `/thumbnails/${variant.id}.jpg`),
      ...(variantPreview ? { preview: variantPreview } : {}),
      access: variantAccess,
      ...(variantAccess === "pro" ? { upgradeUrl } : {}),
    };
  });
  const preview = optionalMediaUrl(override.preview ?? shader.preview ?? primaryVariant?.preview)
    ?? optionalMediaUrl(`/previews/${mediaId}.webm`);
  return {
    id,
    label: String(override.label ?? shader.label),
    description: String(override.description ?? shader.description),
    category: String(shader.category),
    runtime: String(shader.runtime),
    tags: Array.isArray(shader.tags) ? shader.tags.map(String) : [],
    thumbnail: mediaUrl(override.thumbnail ?? shader.thumbnail, `/thumbnails/${mediaId}.jpg`),
    ...(preview ? { preview } : {}),
    access,
    ...(variants.length ? { variants } : {}),
    ...(access === "pro" ? { upgradeUrl } : { sourceId: String(shader.id) }),
  };
}

function safeRelativePath(path) {
  return typeof path === "string" && !path.startsWith("/") && !path.split("/").includes("..");
}

function languageFor(path) {
  const extension = extname(path).slice(1);
  return extension === "js" || extension === "mjs" ? "javascript"
    : extension === "ts" || extension === "tsx" ? "typescript"
      : extension || "text";
}

async function hydrateFile(file) {
  if (!safeRelativePath(file.path) || !textExtensions.has(extname(file.path))) {
    return { error: "non-text-or-unsafe-path" };
  }
  let code = typeof file.code === "string" ? file.code : null;
  if (code === null) {
    const absolutePath = join(sourceRoot, file.path);
    const fileStat = await stat(absolutePath).catch(() => null);
    if (!fileStat || !fileStat.isFile() || fileStat.size > maxTextBytes) return { error: "missing-or-large-source" };
    code = await readFile(absolutePath, "utf8");
  }
  return {
    file: {
      path: file.path,
      language: file.language || languageFor(file.path),
      role: file.role || "source",
      sha256: createHash("sha256").update(code).digest("hex"),
      code,
    },
  };
}

const sourceRegistry = JSON.parse(await readFile(sourceRegistryPath, "utf8"));
const registryById = new Map(sourceRegistry.components.map((component) => [component.id, component]));

const vite = await createServer({
  root: sourceRoot,
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "silent",
});

let shaderModule;
try {
  shaderModule = await vite.ssrLoadModule("/src/data/shaders.tsx");
} finally {
  await vite.close();
}

const accessById = new Map();
for (const shader of shaderModule.READY_SHADERS) {
  rememberAccess(accessById, String(shader.id), shaderModule.getShaderAccess(shader));
  for (const variant of shader.variants ?? []) {
    rememberAccess(accessById, String(variant.id), shaderModule.getShaderAccess(shader, variant));
  }
}

const proIds = new Set([...accessById].filter(([, access]) => access === "pro").map(([id]) => id));
const proFilePaths = new Set();
for (const id of proIds) {
  const component = registryById.get(id);
  for (const file of component?.files ?? []) proFilePaths.add(file.path);
}

const proImportNames = new Set();
for (const shader of shaderModule.READY_SHADERS) {
  if (shaderModule.getShaderAccess(shader) === "pro" && shader.importName) proImportNames.add(String(shader.importName));
  for (const variant of shader.variants ?? []) {
    if (shaderModule.getShaderAccess(shader, variant) === "pro") {
      const matching = shaderModule.READY_SHADERS.find((candidate) => candidate.id === variant.id);
      if (matching?.importName) proImportNames.add(String(matching.importName));
    }
  }
}

const forbiddenSourcePatterns = [
  /\/Users\/[A-Za-z0-9._-]+\//,
  /import\.meta\.env/,
  /process\.env/,
  /supabase/i,
  /checkout/i,
  /AuthProvider/,
];

const communityCandidates = [];
const pro = [];
for (const shader of shaderModule.VISIBLE_READY_SHADERS) {
  if (shader.status === "beta") continue;
  const baseAccess = shaderModule.getShaderAccess(shader) === "pro" ? "pro" : "community";
  if (baseAccess === "pro") pro.push(publicMetadata(shader, "pro"));
  else communityCandidates.push(publicMetadata(shader, "community"));
}

const community = [];
const publicSources = [];
const omittedCommunity = [];
for (const item of communityCandidates) {
  const component = registryById.get(item.sourceId);
  let reason = "";
  if (!component) reason = "missing-reviewed-source";
  else if ((component.assets ?? []).length > 0) reason = "bundled-assets-require-license-review";
  else if ((component.files ?? []).some((file) => proFilePaths.has(file.path))) reason = "source-file-overlaps-pro";

  const hydrated = [];
  if (!reason) {
    for (const file of component.files ?? []) {
      const result = await hydrateFile(file);
      if (result.error) {
        reason = result.error;
        break;
      }
      hydrated.push(result.file);
    }
  }

  if (!reason) {
    const sourceText = hydrated.map((file) => file.code).join("\n");
    if (forbiddenSourcePatterns.some((pattern) => pattern.test(sourceText))) reason = "network-private-or-environment-dependency";
    else if (externalUrls(sourceText).some((url) => !allowedSourceUrl(url))) reason = "network-private-or-environment-dependency";
    else if ([...proIds].some((id) => sourceText.includes(id))) reason = "source-mentions-pro-id";
    else if ([...proImportNames].some((name) => new RegExp(`\\b${name}\\b`).test(sourceText))) reason = "source-mentions-pro-export";
  }

  if (reason) {
    omittedCommunity.push({ id: item.id, label: item.label, reason });
    const { sourceId: _sourceId, ...previewOnlyItem } = item;
    community.push({ ...previewOnlyItem, sourceAvailability: "preview-only" });
    continue;
  }

  community.push(item);
  publicSources.push({
    id: component.id,
    exportName: component.exportName,
    runtime: component.runtime,
    externalDependencies: externalUrls(hydrated.map((file) => file.code).join("\n")).filter(allowedSourceUrl),
    files: hydrated,
  });
}

community.sort((left, right) => left.label.localeCompare(right.label));
pro.sort((left, right) => left.label.localeCompare(right.label));
publicSources.sort((left, right) => left.id.localeCompare(right.id));
omittedCommunity.sort((left, right) => left.label.localeCompare(right.label));

const generatedAt = new Date().toISOString();
const catalog = {
  schemaVersion: 1,
  generatedAt,
  policy: "Community source is included only after positive authorship, no Pro overlap, no bundled assets, and no runtime URL outside the W3 namespace, Google Fonts, or pinned Three.js allowlist. Pro records are media metadata only.",
  upgradeUrl,
  community,
  pro,
};
const communitySource = {
  schemaVersion: 1,
  generatedAt,
  license: "MIT",
  components: publicSources,
};
const report = {
  schemaVersion: 1,
  generatedAt,
  communityPublished: community.length,
  communitySourcePublished: publicSources.length,
  communityPreviewOnly: omittedCommunity.length,
  proPreviewsPublished: pro.length,
  communityOmitted: omittedCommunity.length,
  omittedCommunity,
};

await mkdir(dataRoot, { recursive: true });
await Promise.all([
  writeFile(join(dataRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`),
  writeFile(join(dataRoot, "community-source.json"), `${JSON.stringify(communitySource, null, 2)}\n`),
  writeFile(join(dataRoot, "resource-report.json"), `${JSON.stringify(report, null, 2)}\n`),
  writeFile(join(projectRoot, "scripts", "pro-signatures.json"), `${JSON.stringify({ ids: [...proIds].sort(), importNames: [...proImportNames].sort() }, null, 2)}\n`),
]);

console.log(`Published ${community.length} Community entries (${publicSources.length} with reviewed source, ${omittedCommunity.length} preview-only) and ${pro.length} media-only Pro previews.`);
