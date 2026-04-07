export type Cell = 0 | 1

export interface AdventureSpec {
  id: string
  name: string
  cols: number
  rows: number
  mask: Cell[][]
  stageOrder: { row: number; col: number }[]
  /** UI 보조(탭 등) — 픽셀 평균색이 있으면 그쪽 우선 */
  accent: string
  /** mask와 동일 크기. 빈 칸은 ''. 채워진 칸은 클리어 시 이 색으로 표시 */
  cellColors: string[][]
  /** 비트맵은 동일, 셀만 색 반전(Invert 챕터) */
  displayInvert?: boolean
}

export function orderFromMask(mask: Cell[][]): { row: number; col: number }[] {
  const o: { row: number; col: number }[] = []
  for (let r = 0; r < mask.length; r++) {
    const row = mask[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 1) o.push({ row: r, col: c })
    }
  }
  return o
}

export function wordLengthForStage(
  idx: number,
  total: number,
): 4 | 5 | 6 {
  if (total <= 0) return 5
  const t = idx / Math.max(total - 1, 1)
  if (t < 0.35) return 4
  if (t < 0.7) return 5
  return 6
}

/** 빈 칸: 투명, 마젠타 키(#ff00ff), 또는 거의 흰색 배경 */
function isEmptyPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 28) return true
  if (r > 235 && g < 40 && b > 235) return true
  const lum = 0.299 * r + 0.587 * g + 0.114 * b
  return lum > 248 && a > 190
}

function averageAccent(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): string {
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const R = data[i]!
      const G = data[i + 1]!
      const B = data[i + 2]!
      const A = data[i + 3]!
      if (isEmptyPixel(R, G, B, A)) continue
      sr += R
      sg += G
      sb += B
      n += 1
    }
  }
  if (n === 0) return '#38bdf8'
  return `rgb(${Math.round(sr / n)},${Math.round(sg / n)},${Math.round(sb / n)})`
}

/** 도트 비트맵(사진·PNG) 합성 시 스테이지(채워진 블록) 상한 — 가능한 한 이 수에 가깝게 */
const TARGET_STAGES_DOTART = 200

/** 랜덤 런 등 */
const TARGET_STAGES_MIN = 100
const TARGET_STAGES_MAX = 150

function pixelFilled(data: Uint8ClampedArray, w: number, x: number, y: number): boolean {
  const i = (y * w + x) * 4
  const R = data[i]!
  const G = data[i + 1]!
  const B = data[i + 2]!
  const A = data[i + 3]!
  return !isEmptyPixel(R, G, B, A)
}

/** b×b 픽셀을 한 칸으로 묶었을 때, 도트가 하나라도 있으면 채워진 블록 개수 */
function countFilledBlocks(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  b: number,
): number {
  const rows = Math.ceil(h / b)
  const cols = Math.ceil(w / b)
  let n = 0
  for (let br = 0; br < rows; br++) {
    for (let bc = 0; bc < cols; bc++) {
      let has = false
      const y0 = br * b
      const y1 = Math.min((br + 1) * b, h)
      const x0 = bc * b
      const x1 = Math.min((bc + 1) * b, w)
      for (let y = y0; y < y1 && !has; y++) {
        for (let x = x0; x < x1; x++) {
          if (pixelFilled(data, w, x, y)) {
            has = true
            break
          }
        }
      }
      if (has) n += 1
    }
  }
  return n
}

/** 블록 한 칸의 대표색: 블록 안 도트 픽셀 RGB 평균 */
function blockAverageColor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  b: number,
  br: number,
  bc: number,
): string | null {
  const y0 = br * b
  const y1 = Math.min((br + 1) * b, h)
  const x0 = bc * b
  const x1 = Math.min((bc + 1) * b, w)
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4
      const R = data[i]!
      const G = data[i + 1]!
      const B = data[i + 2]!
      const A = data[i + 3]!
      if (isEmptyPixel(R, G, B, A)) continue
      sr += R
      sg += G
      sb += B
      n += 1
    }
  }
  if (n === 0) return null
  return `rgb(${Math.round(sr / n)},${Math.round(sg / n)},${Math.round(sb / n)})`
}

/**
 * 블록 크기 b를 골라 채워진 스테이지 수가 cap을 넘지 않으면서
 * 가능한 한 가깝게 맞춤(기본 약 200칸).
 */
function chooseBlockSize(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cap: number = TARGET_STAGES_DOTART,
): number {
  const maxDim = Math.max(w, h)
  let b = 1
  let count = countFilledBlocks(data, w, h, b)
  while (count > cap && b < maxDim) {
    b += 1
    count = countFilledBlocks(data, w, h, b)
  }
  while (b > 1) {
    const prevCount = countFilledBlocks(data, w, h, b - 1)
    if (prevCount > cap) break
    b -= 1
    count = prevCount
  }
  return Math.max(1, b)
}

function buildBlockedSpec(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  b: number,
): { mask: Cell[][]; cellColors: string[][] } {
  const rows = Math.ceil(h / b)
  const cols = Math.ceil(w / b)
  const mask: Cell[][] = []
  const cellColors: string[][] = []
  for (let br = 0; br < rows; br++) {
    mask[br] = []
    cellColors[br] = []
    for (let bc = 0; bc < cols; bc++) {
      const col = blockAverageColor(data, w, h, b, br, bc)
      if (col) {
        mask[br]![bc] = 1
        cellColors[br]![bc] = col
      } else {
        mask[br]![bc] = 0
        cellColors[br]![bc] = ''
      }
    }
  }
  return { mask, cellColors }
}

export type DecodeBitmapOptions = {
  /** 채워진 칸(스테이지) 상한 — 기본 TARGET_STAGES_DOTART(200) */
  targetStages?: number
}

/**
 * 비트맵 이미지(PNG/JPEG 등)를 블록으로 합쳐 스테이지 수를 targetStages 근처로 맞춤.
 */
export function decodeImageToAdventureSpec(
  img: HTMLImageElement,
  id: string,
  name: string,
  opts?: DecodeBitmapOptions,
): AdventureSpec {
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w < 1 || h < 1) {
    throw new Error(`Invalid image size for ${id}`)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(img, 0, 0)
  const { data } = ctx.getImageData(0, 0, w, h)

  const stageCap =
    opts?.targetStages !== undefined && opts.targetStages > 0
      ? opts.targetStages
      : TARGET_STAGES_DOTART
  const b = chooseBlockSize(data, w, h, stageCap)
  const { mask, cellColors } = buildBlockedSpec(data, w, h, b)

  const stageOrder = orderFromMask(mask)
  if (stageOrder.length === 0) {
    throw new Error(`No filled pixels in ${id}`)
  }

  return {
    id,
    name,
    cols: Math.ceil(w / b),
    rows: Math.ceil(h / b),
    mask,
    stageOrder,
    accent: averageAccent(data, w, h),
    cellColors,
  }
}

/** @deprecated PNG 카탈로그 사용 — 빈 배열 */
export const ADVENTURE_BASE_CATALOG: AdventureSpec[] = []
export const ADVENTURE_CATALOG = ADVENTURE_BASE_CATALOG

export function mirrorSpec(spec: AdventureSpec): AdventureSpec {
  const mask = spec.mask.map((row) => [...row].reverse() as Cell[])
  const cellColors = spec.cellColors.map((row) => [...row].reverse())
  return {
    ...spec,
    id: `${spec.id}::mirror`,
    name: `${spec.name} · Mirror`,
    cols: spec.cols,
    rows: spec.rows,
    mask,
    stageOrder: orderFromMask(mask),
    cellColors,
    displayInvert: false,
  }
}

export function invertDisplaySpec(spec: AdventureSpec): AdventureSpec {
  return {
    ...spec,
    id: `${spec.id}::invert`,
    name: `${spec.name} · Invert`,
    displayInvert: true,
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function emptyColorGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ''),
  )
}

/** 시드 기반 랜덤 — 스테이지 수 100~150 */
export function createRandomAdventureSpec(seed: number): AdventureSpec {
  const rand = mulberry32(seed ^ 0x9e3779b9)
  let cols = 10 + Math.floor(rand() * 6)
  let rows = 10 + Math.floor(rand() * 6)
  while (cols * rows < TARGET_STAGES_MAX) {
    if (rand() > 0.5) cols++
    else rows++
  }
  const total = cols * rows
  const maxT = Math.min(total, TARGET_STAGES_MAX)
  const minT = Math.min(total, TARGET_STAGES_MIN)
  const target =
    minT + Math.floor(rand() * (maxT - minT + 1))

  const picked = new Set<number>()
  while (picked.size < target) {
    picked.add(Math.floor(rand() * total))
  }

  const mask: Cell[][] = []
  const cellColors = emptyColorGrid(rows, cols)
  for (let r = 0; r < rows; r++) {
    mask[r] = []
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const on = (picked.has(idx) ? 1 : 0) as Cell
      mask[r]![c] = on
    }
  }

  const order = orderFromMask(mask)
  const id = `random-${seed}`
  const accents = ['#38bdf8', '#fbbf24', '#a78bfa', '#34d399', '#f472b6'] as const
  const accent = accents[Math.abs(seed) % accents.length]!
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mask[r]![c] === 1) cellColors[r]![c] = accent
    }
  }
  return {
    id,
    name: 'Random Run',
    cols,
    rows,
    mask,
    stageOrder: order,
    accent,
    cellColors,
  }
}
