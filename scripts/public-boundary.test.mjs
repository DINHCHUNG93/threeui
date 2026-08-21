import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createServer } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(await readFile(join(root, "public", "community-sync-report.json"), "utf8"));
const sourceRegistry = JSON.parse(await readFile(join(root, "public", "source-code.json"), "utf8"));
const styles = await readFile(join(root, "src", "styles.css"));

const vite = await createServer({ root, server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
let catalog;
try {
  catalog = await vite.ssrLoadModule("/src/data/shaders.tsx");
} finally {
  await vite.close();
}

const visible = catalog.VISIBLE_READY_SHADERS;
const allRoutes = catalog.READY_SHADERS;
const componentReport = new Map(report.components.map((component) => [component.id, component]));

test("the public catalog is the complete current Community snapshot", () => {
  assert.equal(report.communityParents, 50);
  assert.equal(report.communityRoutes, 111);
  assert.equal(report.communityVariants, 141);
  assert.ok(report.excludedProParents > 0, "the source snapshot should contain excluded Pro parents");
  assert.ok(report.excludedBetaParents > 0, "the source snapshot should contain excluded Beta parents");
  assert.equal(visible.length, report.communityParents);
  assert.equal(allRoutes.length, report.communityRoutes);
  assert.equal(new Set(allRoutes.map((shader) => shader.id)).size, allRoutes.length);
  assert.ok(allRoutes.every((shader) => shader.status === undefined && shader.access === undefined));
});

test("every free variant and control stays in sync with the source snapshot", () => {
  assert.deepEqual([...componentReport.keys()].sort(), visible.map((shader) => shader.id).sort());

  let variantCount = 0;
  for (const shader of visible) {
    const expected = componentReport.get(shader.id);
    const variants = shader.variants ?? [];
    variantCount += variants.length;
    assert.deepEqual(variants.map((variant) => variant.id), expected.variantIds, `${shader.id} variant drift`);
    assert.deepEqual((shader.controls ?? []).map((control) => control.key), expected.controlKeys, `${shader.id} control drift`);
    for (const variant of variants) {
      assert.deepEqual(
        (variant.controls ?? []).map((control) => control.key),
        expected.variantControlKeys[variant.id],
        `${shader.id}/${variant.id} control drift`,
      );
    }
  }
  assert.equal(variantCount, report.communityVariants);

  assert.equal(componentReport.get("brand-orbs").variantIds.length, 23);
  assert.equal(componentReport.get("predictive-arc").variantIds.length, 8);
  assert.equal(componentReport.get("character-carousel").variantIds.length, 2);
});

test("all Community parents include their implementation source", () => {
  const ids = visible.map((shader) => shader.id).sort();
  assert.deepEqual([...sourceRegistry.readyIds].sort(), ids);
  assert.deepEqual(sourceRegistry.components.map((component) => component.id).sort(), ids);
  assert.equal(new Set(sourceRegistry.readyIds).size, sourceRegistry.readyIds.length);

  for (const component of sourceRegistry.components) {
    assert.ok(component.files.length + component.sharedFilePaths.length > 0, `${component.id} has no source`);
    for (const file of component.files) {
      assert.ok(
        file.path.startsWith("src/shaders/")
          || file.path.startsWith("public/")
          || file.path === "scripts/generate-landscape.mjs",
        `${component.id} includes an unexpected source path`,
      );
      assert.equal(createHash("sha256").update(file.code).digest("hex"), file.sha256, `${file.path} hash mismatch`);
    }
    for (const path of component.sharedFilePaths) {
      assert.ok(path.startsWith("src/shaders/") || path.startsWith("public/"));
    }
  }
});

test("the main layout stylesheet remains byte-identical to the synchronized snapshot", () => {
  assert.equal(createHash("sha256").update(styles).digest("hex"), report.layoutStylesSha256);
});

test("mixed-access renderers expose only their Community option", async () => {
  const exactSurfaces = [
    ["src/shaders/globe/GlobeCollection.tsx", 'export type GlobeVariant = "energy-orb"'],
    ["src/shaders/spark-badge/SparkBadge.tsx", 'export type SparkBadgeVariant = "badge"'],
    ["src/shaders/sylva-living-world/SylvaLivingWorldScene.tsx", 'export type SylvaLivingWorldVariant = "living-green"'],
    ["src/shaders/temple-night/TempleNightScene.tsx", 'export type TempleNightVariant = "temple-night"'],
  ];
  for (const [path, signature] of exactSurfaces) {
    const source = await readFile(join(root, path), "utf8");
    assert.ok(source.includes(signature), `${path} is missing its exact Community variant boundary`);
    assert.equal((source.match(/export type .*Variant =/g) ?? []).length, 1, `${path} exposes another variant union`);
  }

  const landingPages = await readFile(join(root, "src/shaders/landing-pages/LandingPages.tsx"), "utf8");
  assert.equal((landingPages.match(/export function /g) ?? []).length, 6, "landing pages should export the frame and five Community pages");
});

test("the public shell keeps the main UI but has no auth or private catalog runtime", async () => {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:css|html|js|jsx|json|mjs|ts|tsx)$/.test(entry.name)) files.push(path);
    }
  }
  await walk(join(root, "src"));
  const combined = (await Promise.all(files.map((path) => readFile(path, "utf8")))).join("\n");
  for (const pattern of [
    /\/Users\/[A-Za-z0-9._-]+\//,
    /shader-field-react/,
    /threeui\.netlify\.app/,
    /AuthProvider/,
    /AccountButton/,
    /OAuthConsent/,
    /@supabase\//,
    /createClient\s*\(/,
    /supabase\.auth/,
    /create-checkout-session/i,
    /stripe-webhook/i,
    /VITE_SUPABASE/,
    /SFProDisplay/,
    /Maccess SF/,
    /sf-(?:bold|light|medium|regular|semibold)\.woff2/,
  ]) assert.doesNotMatch(combined, pattern);

  for (const path of [
    "src/auth",
    "src/components/ProShaderDocumentation.tsx",
    "src/components/AccountButton.tsx",
    "src/components/OAuthConsent.tsx",
    "src/components/PricingDocumentation.tsx",
    "src/catalogVisibility.ts",
    "src/localBeta.ts",
  ]) await assert.rejects(stat(join(root, path)), `${path} must not ship`);

  const maccessAssets = await readdir(join(root, "src/shaders/maccess-elements/assets"));
  assert.ok(maccessAssets.every((name) => !name.endsWith(".woff2")), "restricted font binaries must not ship");

  const app = await readFile(join(root, "src", "App.tsx"), "utf8");
  const sidebar = await readFile(join(root, "src", "components", "Sidebar.tsx"), "utf8");
  const upgrade = await readFile(join(root, "src", "components", "UpgradeLink.tsx"), "utf8");
  for (const token of ["sidebar", "topbar", "pane-scroll", "mobile-nav-scrim"]) assert.match(`${app}\n${sidebar}`, new RegExp(token));
  assert.match(upgrade, /https:\/\/threeui\.com\/pricing/);
});
