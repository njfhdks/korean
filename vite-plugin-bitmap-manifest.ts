import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { Plugin } from 'vite'
import { formatBitmapNameFromFileBase } from './src/lib/bitmapDisplayName'

/** public/bitmap 안의 이미지 파일명 */
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i

type ManifestEntry = {
  id: string
  name: string
  file: string
  targetStages?: number
}

function listImageFiles(bitmapDir: string): string[] {
  if (!fs.existsSync(bitmapDir)) return []
  return fs
    .readdirSync(bitmapDir, { withFileTypes: true })
    .filter((e) => e.isFile() && IMAGE_EXT.test(e.name))
    .map((e) => e.name)
}

function makeEntryFromFile(file: string): ManifestEntry {
  const baseRaw = file.replace(/\.[^.]+$/i, '')
  const base = baseRaw.normalize('NFC')
  let id = base
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!id) id = 'map'
  const name = formatBitmapNameFromFileBase(base) || id
  return { id, name, file }
}

function readExistingManifest(outPath: string): unknown[] {
  try {
    const raw = fs.readFileSync(outPath, 'utf8')
    const j = JSON.parse(raw) as unknown
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

function sanitizeEntry(raw: unknown, usedIds: Set<string>): ManifestEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.file !== 'string' || !o.file) return null
  let id =
    typeof o.id === 'string' && o.id.trim()
      ? o.id.trim()
      : makeEntryFromFile(o.file).id
  if (usedIds.has(id)) {
    const h = crypto.createHash('md5').update(o.file).digest('hex').slice(0, 6)
    id = `${id}-${h}`
  }
  usedIds.add(id)
  const name =
    typeof o.name === 'string' && o.name.trim()
      ? o.name.trim()
      : makeEntryFromFile(o.file).name
  const entry: ManifestEntry = { id, name, file: o.file }
  if (
    typeof o.targetStages === 'number' &&
    Number.isFinite(o.targetStages) &&
    o.targetStages > 0
  ) {
    entry.targetStages = Math.floor(o.targetStages)
  }
  return entry
}

/**
 * public/bitmap 이미지와 manifest.json 동기화.
 * **기존 manifest에 나온 순서·targetStages·id·name을 유지**하고,
 * 폴더에만 있고 목록에 없는 새 이미지는 **파일명 순으로 맨 뒤에** 추가한다.
 * (전부 알파벳 순으로 덮어쓰면 monarisa가 banana보다 앞에 오는 문제가 있었음.)
 */
export function syncBitmapManifest(): Plugin {
  const bitmapDir = path.resolve(process.cwd(), 'public/bitmap')
  const outPath = path.join(bitmapDir, 'manifest.json')

  function run() {
    if (!fs.existsSync(bitmapDir)) {
      fs.mkdirSync(bitmapDir, { recursive: true })
      return
    }

    const imageFiles = listImageFiles(bitmapDir)
    const imageSet = new Set(imageFiles)

    const usedIds = new Set<string>()
    const kept: ManifestEntry[] = []
    const seenFile = new Set<string>()

    for (const raw of readExistingManifest(outPath)) {
      const e = sanitizeEntry(raw, usedIds)
      if (!e || !imageSet.has(e.file) || seenFile.has(e.file)) continue
      seenFile.add(e.file)
      kept.push(e)
    }

    const newcomers = imageFiles
      .filter((f) => !seenFile.has(f))
      .sort((a, b) => a.localeCompare(b, 'en'))

    const manifest: ManifestEntry[] = [
      ...kept,
      ...newcomers.map((file) => {
        const base = makeEntryFromFile(file)
        if (usedIds.has(base.id)) {
          const h = crypto.createHash('md5').update(file).digest('hex').slice(0, 6)
          base.id = `${base.id}-${h}`
        }
        usedIds.add(base.id)
        return base
      }),
    ]

    const nextJson = JSON.stringify(manifest, null, 2) + '\n'
    if (fs.existsSync(outPath)) {
      try {
        if (fs.readFileSync(outPath, 'utf8') === nextJson) return
      } catch {
        /* write */
      }
    }
    fs.writeFileSync(outPath, nextJson)
  }

  return {
    name: 'sync-bitmap-manifest',
    buildStart: run,
    configureServer(server) {
      run()
      server.watcher.add(bitmapDir)
      const onImage = (p: string) => {
        if (p.startsWith(bitmapDir) && IMAGE_EXT.test(p)) run()
      }
      server.watcher.on('add', onImage)
      server.watcher.on('unlink', onImage)
      server.watcher.on('change', onImage)
    },
  }
}
