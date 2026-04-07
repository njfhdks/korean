/**
 * `public/`에 넣은 정적 파일 URL.
 * GitHub Pages 등 `base: '/korean/'` 일 때 `import.meta.env.BASE_URL`이 반영됨.
 */
export function publicAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL
  const path = relativePath.replace(/^\/+/, '')
  return `${base}${path}`
}
