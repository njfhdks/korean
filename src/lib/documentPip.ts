/**
 * Chrome Document Picture-in-Picture (웹 전용, 선택 기능).
 * @see https://developer.chrome.com/docs/web-platform/document-picture-in-picture
 */

type PipAPI = {
  requestWindow: (options?: {
    width?: number
    height?: number
  }) => Promise<Window>
}

export function getPipApi(): PipAPI | null {
  if (typeof window === 'undefined') return null
  const pip = (window as unknown as { documentPictureInPicture?: PipAPI })
    .documentPictureInPicture
  if (!pip || typeof pip.requestWindow !== 'function') return null
  return pip
}

export function supportsDocumentPictureInPicture(): boolean {
  return getPipApi() != null
}

export async function requestDocumentPictureInPictureWindow(
  width = 420,
  height = 640,
): Promise<Window | null> {
  const api = getPipApi()
  if (!api) return null
  try {
    return await api.requestWindow({ width, height })
  } catch {
    return null
  }
}

/** PiP 창에 현재 문서의 스타일을 복사 (Tailwind·Vite 주입 포함) */
export function copyStylesToPictureInPictureWindow(pipWindow: Window): void {
  const target = pipWindow.document

  const base = target.createElement('base')
  base.href = document.baseURI
  target.head.appendChild(base)

  document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    if (!(node instanceof HTMLLinkElement) || !node.href) return
    const link = target.createElement('link')
    link.rel = 'stylesheet'
    link.href = node.href
    target.head.appendChild(link)
  })

  document.querySelectorAll('style').forEach((node) => {
    if (!(node instanceof HTMLStyleElement)) return
    const style = target.createElement('style')
    style.textContent = node.textContent
    target.head.appendChild(style)
  })

  /* adoptedStyleSheets / 규칙 직렬화 (일부 환경에서만 link/style로는 부족할 때) */
  try {
    for (const sheet of document.styleSheets) {
      try {
        const rules = [...sheet.cssRules].map((r) => r.cssText).join('\n')
        if (!rules.trim()) continue
        const style = target.createElement('style')
        style.textContent = rules
        target.head.appendChild(style)
      } catch {
        if (sheet.href) {
          const link = target.createElement('link')
          link.rel = 'stylesheet'
          link.href = sheet.href
          target.head.appendChild(link)
        }
      }
    }
  } catch {
    /* noop */
  }

  const meta = target.createElement('meta')
  meta.name = 'color-scheme'
  meta.content = 'light dark'
  target.head.appendChild(meta)

  target.documentElement.className = document.documentElement.className
  target.documentElement.lang = document.documentElement.lang
  target.body.style.margin = '0'
  target.body.style.minHeight = '100vh'
  target.body.style.boxSizing = 'border-box'
}
