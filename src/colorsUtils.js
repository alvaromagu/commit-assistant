export function style (text, { bg, color, style }) {
  return [bg, color, style].reduce((acc, fn) => fn?.(acc) ?? acc, text)
}
