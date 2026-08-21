import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../public/data/catalog.json", import.meta.url), "utf8"));
const source = JSON.parse(await readFile(new URL("../public/data/community-source.json", import.meta.url), "utf8"));
const report = JSON.parse(await readFile(new URL("../public/data/resource-report.json", import.meta.url), "utf8"));
const signatures = JSON.parse(await readFile(new URL("./pro-signatures.json", import.meta.url), "utf8"));
const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const generatorSource = await readFile(new URL("./build-public-catalog.mjs", import.meta.url), "utf8");
const sourceById = new Map(source.components.map((component) => [component.id, component]));
const allowedProKeys = new Set(["id", "label", "description", "category", "runtime", "tags", "thumbnail", "preview", "access", "upgradeUrl", "variants"]);
const allowedVariantKeys = new Set(["id", "label", "description", "thumbnail", "preview", "access", "upgradeUrl"]);

test("catalog has distinct reviewed Community and media-only Pro sets", () => {
  assert.ok(catalog.community.length > 0, "expected at least one reviewed Community resource");
  assert.ok(catalog.pro.length > 0, "expected at least one Pro preview");
  const ids = [...catalog.community, ...catalog.pro].map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "every public catalog record needs a unique id");
  const communityIds = new Set(catalog.community.map((item) => item.id));
  for (const item of catalog.pro) assert.ok(!communityIds.has(item.id), `${item.id} cannot be both Community and Pro`);
});

test("every Community card has reviewed source or a documented preview-only boundary", () => {
  const previewOnlyIds = new Set(report.omittedCommunity.map((item) => item.id));
  for (const item of catalog.community) {
    assert.equal(item.access, "community");
    if (item.sourceId) assert.ok(sourceById.has(item.sourceId), `${item.id} is missing source ${item.sourceId}`);
    else {
      assert.equal(item.sourceAvailability, "preview-only");
      assert.ok(previewOnlyIds.has(item.id), `${item.id} needs a documented source-boundary reason`);
    }
  }
});

test("Pro records cannot carry source-bearing fields", () => {
  for (const item of catalog.pro) {
    assert.equal(item.access, "pro");
    assert.equal(item.upgradeUrl, "https://threeui.com/pricing");
    assert.match(item.thumbnail, /^https:\/\/threeui\.com\//);
    assert.match(item.preview, /^https:\/\/threeui\.com\//);
    for (const key of Object.keys(item)) assert.ok(allowedProKeys.has(key), `${item.id} exposes forbidden field ${key}`);
    for (const variant of item.variants ?? []) {
      assert.equal(variant.access, "pro");
      assert.equal(variant.upgradeUrl, "https://threeui.com/pricing");
      if (variant.preview) assert.match(variant.preview, /^https:\/\/threeui\.com\//);
      for (const key of Object.keys(variant)) assert.ok(allowedVariantKeys.has(key), `${item.id}/${variant.id} exposes forbidden field ${key}`);
    }
  }
});

test("variant families retain media metadata without implementation fields", () => {
  const families = [...catalog.community, ...catalog.pro].filter((item) => (item.variants?.length ?? 0) > 1);
  assert.ok(families.length > 0, "expected published variant families");
  for (const item of families) {
    for (const variant of item.variants) {
      assert.match(variant.thumbnail, /^https:\/\/threeui\.com\//);
      if (variant.preview) assert.match(variant.preview, /^https:\/\/threeui\.com\//);
      for (const key of Object.keys(variant)) assert.ok(allowedVariantKeys.has(key), `${item.id}/${variant.id} exposes forbidden field ${key}`);
      assert.ok(!("sourceId" in variant) && !("props" in variant) && !("controls" in variant), `${item.id}/${variant.id} exposes implementation metadata`);
    }
  }
});

test("public app preserves the reduced ThreeUI shell without auth or private feature imports", () => {
  for (const token of ["sidebar", "browse-grid", "browse-category-filters", "theme-buttons", "pro-disclosure", "source-card"]) {
    assert.match(`${appSource}\n${styles}`, new RegExp(`\\b${token}\\b`), `missing ThreeUI shell surface ${token}`);
  }
  assert.doesNotMatch(appSource, /AccountButton|AuthProvider|OAuthConsent|McpDocumentation|PricingDocumentation|supabase|stripe/i);
  assert.match(appSource, /View full ThreeUI/);
  assert.match(appSource, /Preview only in this repository/);
  assert.match(appSource, /variant-picker/);
  assert.doesNotMatch(appSource, /\bbeta\b/i);
  assert.match(generatorSource, /shader\.status === "beta"/);
});

function allowedSourceUrl(value) {
  const url = new URL(value.replaceAll("&amp;", "&"));
  if (url.hostname === "www.w3.org" && ["/2000/svg", "/1999/xhtml"].includes(url.pathname)) return true;
  if (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return true;
  return url.hostname === "cdn.jsdelivr.net" && /^\/npm\/three@[0-9.]+\//.test(url.pathname);
}

test("Community source contains no Pro IDs, exports, private paths, auth, commerce, or unapproved runtime URLs", () => {
  const serialized = JSON.stringify(source);
  for (const id of signatures.ids) assert.ok(!serialized.includes(id), `Community source mentions Pro id ${id}`);
  for (const name of signatures.importNames) assert.ok(!new RegExp(`\\b${name}\\b`).test(serialized), `Community source mentions Pro export ${name}`);
  for (const pattern of [
    /\/Users\/[A-Za-z0-9._-]+\//,
    /import\.meta\.env/,
    /process\.env/,
    /supabase/i,
    /checkout/i,
    /AuthProvider/,
  ]) assert.doesNotMatch(serialized, pattern);
  for (const url of serialized.match(/https?:\/\/[^\\"'<>`)]+/g) ?? []) {
    assert.ok(allowedSourceUrl(url), `unapproved Community source URL ${url}`);
  }
});
