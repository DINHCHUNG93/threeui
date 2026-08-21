export function resolveDetailPreviewSource(fallback: string) {
  const filename = fallback.split("/").pop();
  if (!filename || !/\.(?:mp4|webm)$/i.test(filename)) return fallback;
  return `/previews/detail/${filename.replace(/\.(?:mp4|webm)$/i, ".webm")}`;
}
