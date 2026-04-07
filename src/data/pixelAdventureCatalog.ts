import {
  decodeImageToAdventureSpec,
  type AdventureSpec,
} from './adventureBitmap'
import { formatBitmapNameFromFileBase } from '../lib/bitmapDisplayName'
import { publicAssetUrl } from '../lib/publicAssetUrl'

export type BitmapManifestEntry = {
  id: string
  name: string
  file: string
  /** 도트 합성 시 채워진 스테이지(칸) 상한 — 없으면 기본 ~200 */
  targetStages?: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * `public/bitmap/manifest.json` + PNG 목록으로 카탈로그 생성.
 * manifest가 없거나 비어 있으면 [].
 */
export async function loadPixelAdventureCatalog(): Promise<AdventureSpec[]> {
  let list: BitmapManifestEntry[] = []
  try {
    const res = await fetch(publicAssetUrl('bitmap/manifest.json'))
    if (!res.ok) return []
    list = (await res.json()) as BitmapManifestEntry[]
  } catch {
    return []
  }
  if (!Array.isArray(list) || list.length === 0) return []

  const out: AdventureSpec[] = []
  for (const item of list) {
    if (!item?.id || !item?.file) continue
    const baseFromFile = item.file.replace(/\.[^.]+$/i, '')
    const fromManifest = item.name?.trim()
    const name =
      fromManifest ||
      formatBitmapNameFromFileBase(baseFromFile) ||
      item.id
    const url = publicAssetUrl(`bitmap/${item.file.replace(/^\/+/, '')}`)
    try {
      const img = await loadImage(url)
      const targetStages =
        typeof item.targetStages === 'number' && item.targetStages > 0
          ? item.targetStages
          : undefined
      out.push(
        decodeImageToAdventureSpec(img, item.id, name, {
          targetStages,
        }),
      )
    } catch {
      /* 스킵: 깨진 항목 */
    }
  }
  return out
}
