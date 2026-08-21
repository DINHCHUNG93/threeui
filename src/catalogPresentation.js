export function catalogLabel(shader) {
  return shader.label.endsWith(" Hero")
    ? shader.label.slice(0, -" Hero".length)
    : shader.label;
}

export function catalogSlug(shader) {
  return shader.id.endsWith("-hero")
    ? shader.id.slice(0, -"-hero".length)
    : shader.id;
}
