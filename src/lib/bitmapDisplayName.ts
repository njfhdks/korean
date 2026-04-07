/** 꾸밈·배경 단어 제거 후 과일/주제만 남김 */
/** 색·잎 등 꾸밈말만 제거 (orange·grape 등 과일 단어는 제외) */
const DECOR_WORDS = new Set([
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'pink',
  'brown',
  'dark',
  'light',
  'leaf',
  'leaves',
  'pixellab',
])

function titleCaseWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * public/bitmap 파일명(확장자 제외) → 표시 이름
 * 예: pixellab-banana-1775456435946 → Banana
 */
export function formatBitmapNameFromFileBase(base: string): string {
  let t = base.trim()
  t = t.replace(/^pixellab[-_]?/i, '')
  const segments = t.split(/[-_]+/).filter(Boolean)
  while (segments.length && /^\d+$/.test(segments[segments.length - 1]!)) {
    segments.pop()
  }
  const fruitParts = segments.filter(
    (p) => !/^\d+$/.test(p) && !DECOR_WORDS.has(p.toLowerCase()),
  )
  const label = fruitParts.join(' ')
  if (label.length > 0) return titleCaseWords(label)
  const fallback = segments.filter((p) => !/^\d+$/.test(p)).join(' ')
  return titleCaseWords(fallback.replace(/[-_]+/g, ' ') || base)
}
