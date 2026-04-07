import {
  DAILY_WORD_SET,
  pickDailyRandomAnswer,
} from '../data/dailyAnswerPool'
import { loadJson, saveJson, localIsoDate } from '../storage/gameStorage'

function dailyStorageKey(len: 4 | 5 | 6): string {
  const day = localIsoDate(new Date())
  return `wordmap:dailyword:${day}:${len}`
}

export function getOrCreateDailyAnswer(
  len: 4 | 5 | 6,
): string {
  const key = dailyStorageKey(len)
  const cached = loadJson<string | null>(key, null)
  if (cached && DAILY_WORD_SET.has(cached)) return cached
  const w = pickDailyRandomAnswer(len)
  saveJson(key, w)
  return w
}
