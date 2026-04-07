/**
 * 어드벤처 전용 풀(전체 목록에서 데일리 730개 제외). `scripts/generate-daily-adventure-pools.mjs`로 생성.
 */
import adventureRaw from './word_lists/adventure_pool.json'

type PoolJson = { '4': string[]; '5': string[]; '6': string[] }

const p = adventureRaw as PoolJson

export const ADVENTURE_BY_LENGTH = new Map<4 | 5 | 6, string[]>([
  [4, p['4']],
  [5, p['5']],
  [6, p['6']],
])

export const ADVENTURE_WORD_SET = new Set<string>([
  ...p['4'],
  ...p['5'],
  ...p['6'],
])

for (const len of [4, 5, 6] as const) {
  const n = ADVENTURE_BY_LENGTH.get(len)?.length ?? 0
  if (n < 1) throw new Error(`Adventure pool: need words for length ${len}`)
}
