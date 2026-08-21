import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../public/data/catalog.json", import.meta.url), "utf8"));
const source = JSON.parse(await readFile(new URL("../public/data/community-source.json", import.meta.url), "utf8"));
const signatures = JSON.parse(await readFile(new URL("./pro-signatures.json", import.meta.url), "utf8"));
const sourceById = new Map(source.components.map((component) => [component.id, component]));
const allowedProKeys = new Set(["id", "label", "description", "category", "runtime", "tags", "thumbnail", "preview", "access", "upgradeUrl"]);

test("catalog has distinct reviewed Community and media-only Pro sets", () => {
  assert.ok(catalog.community.length > 0, "expected at least one reviewed Community resource");
  assert.ok(catalog.pro.length > 0, "expected at least one Pro preview");
  const ids = [...catalog.community, ...catalog.pro].map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "every public catalog record needs a unique id");
  const communityIds = new Set(catalog.community.map((item) => item.id));
  for (const item of catalog.pro) assert.ok(!communityIds.has(item.id), `${item.id} cannot be both Community and Pro`);
});

test("every Community card has a committed source bundle", () => {
  for (const item of catalog.community) {
    assert.equal(item.access, "community");
    assert.ok(sourceById.has(item.sourceId), `${item.id} is missing source ${item.sourceId}`);
  }
});

test("Pro records cannot carry source-bearing fields", () => {
  for (const item of catalog.pro) {
    assert.equal(item.access, "pro");
    assert.equal(item.upgradeUrl, "https://threeui.netlify.app/pricing");
    assert.match(item.thumbnail, /^https:\/\/threeui\.netlify\.app\//);
    assert.match(item.preview, /^https:\/\/threeui\.netlify\.app\//);
    for (const key of Object.keys(item)) assert.ok(allowedProKeys.has(key), `${item.id} exposes forbidden field ${key}`);
  }
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
