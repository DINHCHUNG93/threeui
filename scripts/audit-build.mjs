import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const signatures = JSON.parse(await readFile(new URL("./pro-signatures.json", import.meta.url), "utf8"));
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push(path);
  }
}

await walk(dist);
const maps = files.filter((path) => path.endsWith(".map"));
if (maps.length) throw new Error(`Public build contains source maps:\n${maps.map((path) => relative(root, path)).join("\n")}`);

const textFiles = files.filter((path) => [".css", ".html", ".js", ".json"].includes(extname(path)));
const combined = (await Promise.all(textFiles.map((path) => readFile(path, "utf8")))).join("\n");
for (const pattern of [/\/Users\/[A-Za-z0-9._-]+\//, /supabase\.co/i, /AuthProvider/, /create-checkout-session/, /stripe-webhook/i, /VITE_SUPABASE/]) {
  if (pattern.test(combined)) throw new Error(`Public build contains forbidden runtime signature ${pattern}`);
}
for (const name of signatures.importNames) {
  if (new RegExp(`\\b${name}\\b`).test(combined)) throw new Error(`Public build contains Pro implementation export ${name}`);
}

console.log(`Build audit passed: ${files.length} files, no source maps, auth/commerce runtime, local paths, or Pro implementation exports.`);
