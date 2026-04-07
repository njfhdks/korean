/**
 * 데일리 전용 730단어(4·5·6글자 균등 분배). `scripts/generate-daily-adventure-pools.mjs`로 생성.
 */
import dailyRaw from './word_lists/daily_pool.json'

type PoolJson = { '4': string[]; '5': string[]; '6': string[] }

const p = dailyRaw as PoolJson

export const DAILY_BY_LENGTH = new Map<4 | 5 | 6, string[]>([
  [4, p['4']],
  [5, p['5']],
  [6, p['6']],
])

export const DAILY_WORD_SET = new Set<string>([
  ...p['4'],
  ...p['5'],
  ...p['6'],
])

for (const len of [4, 5, 6] as const) {
  const n = DAILY_BY_LENGTH.get(len)?.length ?? 0
  if (n < 1) throw new Error(`Daily pool: need words for length ${len}`)
}

export function pickDailyRandomAnswer(len: 4 | 5 | 6, exclude?: string): string {
  const pool = DAILY_BY_LENGTH.get(len) ?? []
  const ex = exclude?.toLowerCase()
  const filtered = ex ? pool.filter((w) => w !== ex) : pool
  const src = filtered.length ? filtered : pool
  if (!src.length) throw new Error(`No daily candidates for length ${len}`)
  return src[Math.floor(Math.random() * src.length)]!
}
