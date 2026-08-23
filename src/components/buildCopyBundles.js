function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function markdownFence(code) {
  const longestRun = Math.max(0, ...(code.match(/`+/g) ?? []).map((run) => run.length));
  return "`".repeat(Math.max(3, longestRun + 1));
}

function assetSection(assets) {
  if (assets.length === 0) return ["No binary assets are required.", ""];
  return [
    "Binary assets cannot be represented as executable text. Copy each asset byte-for-byte from the ThreeUI package and verify its hash:",
    "",
    "| Path | MIME type | Bytes | SHA-256 |",
    "| --- | --- | ---: | --- |",
    ...assets.map((asset) => `| \`${markdownCell(asset.path)}\` | ${markdownCell(asset.mimeType)} | ${asset.bytes} | \`${asset.sha256}\` |`),
    "",
  ];
}

function sourceFileSection(file) {
  const fence = markdownFence(file.code);
  const code = file.code.endsWith("\n") ? file.code : `${file.code}\n`;
  return [
    `### \`${file.path}\``,
    "",
    `Role: ${file.role} · ${file.lines} lines · ${file.bytes} bytes · SHA-256 \`${file.sha256}\``,
    "",
    `${fence}${file.language}`,
    `${code}${fence}`,
    "",
  ];
}

function fullSourceSection(files) {
  return [
    `This bundle contains all ${files.length} required text source files. Preserve their paths and contents; none are excerpts.`,
    "",
    ...files.flatMap(sourceFileSection),
  ];
}

function sourceReferenceSection(files, sourceBaseUrl, sourcePageUrl) {
  const primary = files.find((file) => ["canonical-source", "scene-source"].includes(file.role)) ?? files[0];
  if (!primary) return ["No source file is registered for this component.", ""];

  const filename = primary.path.split("/").at(-1) ?? primary.path;
  const directUrl = primary.sourceUrl ? new URL(primary.sourceUrl, sourceBaseUrl).href : sourcePageUrl;

  return [
    `### Source code: [${filename}](${directUrl})`,
    "",
  ];
}

export function buildPromptSourceFallback(shader) {
  const files = (shader.sourceFiles ?? []).flatMap((sourceFile, index) => {
    const path = String(sourceFile).split(" — ", 1)[0].trim();
    if (!path || !/\.[a-z0-9]+$/i.test(path)) return [];
    const publicPath = path.startsWith("public/") ? `/${path.slice("public/".length)}` : undefined;
    return [{
      path,
      language: "text",
      role: publicPath ? "canonical-source" : index === 0 ? "component" : "reference-source",
      bytes: 0,
      lines: 0,
      sha256: "local-beta-reference",
      ...(publicPath ? { sourceUrl: publicPath } : {}),
    }];
  });

  if (files.length > 0) return files;
  return [{
    path: `${shader.id}.tsx`,
    language: "tsx",
    role: "component",
    bytes: 0,
    lines: 0,
    sha256: "local-beta-reference",
  }];
}

export function buildCodeBundle({ shader, files, assets }) {
  return [
    `# ${shader.label} — Complete source`,
    "",
    `Component: \`${shader.importName}\``,
    `Runtime: ${shader.runtime}`,
    `Source revision: \`${shader.sourceCommit}\``,
    "",
    "## Required assets",
    "",
    ...assetSection(assets),
    "## Full implementation source",
    "",
    ...fullSourceSection(files),
  ].join("\n");
}

export function buildCopyPrompt({ shader, files, activeVariant, sourceBaseUrl, sourcePageUrl }) {
  const variantLines = activeVariant
    ? [
        `### Variant: ${activeVariant.label}`,
      ]
    : [];
  return [
    `## Use the <${shader.importName} /> component from ThreeUI as a reference`,
    "",
    "You are working in an existing application. Use the following ThreeUI example as a visual, interaction, and implementation reference for the requested experience.",
    "",
    `### Component: ${shader.importName}`,
    ...variantLines,
    `### Runtime: ${shader.runtime}`,
    ...sourceReferenceSection(files, sourceBaseUrl, sourcePageUrl),
    "---",
    "",
    "### Reference brief",
    "",
    shader.description,
    "",
    "Review the linked source before making changes. Study its structure, styling, composition, motion, interactions, responsive behavior, and implementation details. Adapt the relevant ideas to the destination project's existing stack, content, and design language. Build the result directly in that project rather than embedding the reference URL.",
    "",
  ].join("\n");
}
