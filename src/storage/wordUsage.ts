import {
  ADVENTURE_BY_LENGTH,
  ADVENTURE_WORD_SET,
} from '../data/adventureAnswerPool'
import { loadJson, saveJson, keys } from './gameStorage'

export type WordUsageState = {
  used: Record<string, boolean>
  /** 모든 단어를 한 번씩 소진한 적 있음 — 뱃지 + 6글자 위주 난이도 */
  wordMasterEver: boolean
}

function defaultState(): WordUsageState {
  return { used: {}, wordMasterEver: false }
}

export function loadWordUsage(): WordUsageState {
  return loadJson<WordUsageState>(keys.wordUsage, defaultState())
}

export function saveWordUsage(s: WordUsageState): void {
  saveJson(keys.wordUsage, s)
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function allWordsUsedInState(s: WordUsageState): boolean {
  for (const w of ADVENTURE_WORD_SET) {
    if (!s.used[w]) return false
  }
  return true
}

/** 마스터 — 6글자 위주 난이도 */
export function isWordMasterHardMode(): boolean {
  return loadWordUsage().wordMasterEver
}

/**
 * 어드벤처 정답: 해당 길이에서 아직 used가 아닌 단어 우선.
 * 한 길이 풀만 소진되면 그 길이만 초기화.
 * 전체 단어가 모두 used면 전체 초기화(다음 픽 직전).
 */
export function pickAdventureUnusedWord(len: 4 | 5 | 6, stableKey: string): string {
  let s = loadWordUsage()

  if (allWordsUsedInState(s)) {
    s = { ...s, used: {} }
    saveWordUsage(s)
  }

  const pool = ADVENTURE_BY_LENGTH.get(len) ?? []
  if (!pool.length) throw new Error(`No answer candidates for length ${len}`)

  let unused = pool.filter((w) => !s.used[w])
  if (unused.length === 0) {
    for (const w of pool) {
      delete s.used[w]
    }
    unused = [...pool]
    saveWordUsage(s)
  }

  const sorted = [...unused].sort()
  const word = sorted[hashString(stableKey) % sorted.length]!
  s.used[word] = true

  if (allWordsUsedInState(s) && !s.wordMasterEver) {
    s.wordMasterEver = true
  }
  saveWordUsage(s)
  return word
}
