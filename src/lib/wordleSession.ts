import { loadJson, saveJson } from '../storage/gameStorage'

const PREFIX = 'wordmap:play:'

export type PersistedGameStatus =
  | 'playing'
  | 'won'
  | 'lost'
  | 'offer_ad'

export type WordleSessionSnapshot = {
  v: 1
  answerLower: string
  wordLength: 4 | 5 | 6
  guesses: string[]
  /** 입력 중인 줄 (대문자) */
  current: string
  status: PersistedGameStatus
  adBonus: boolean
}

function storageKey(id: string): string {
  return PREFIX + encodeURIComponent(id)
}

export function saveWordleSession(
  id: string,
  snapshot: WordleSessionSnapshot,
): void {
  saveJson(storageKey(id), snapshot)
}

export function loadWordleSession(
  id: string,
  answerLower: string,
  L: 4 | 5 | 6,
): WordleSessionSnapshot | null {
  const raw = loadJson<WordleSessionSnapshot | null>(storageKey(id), null)
  if (!raw || raw.v !== 1) return null
  if (raw.answerLower !== answerLower || raw.wordLength !== L) return null
  if (!Array.isArray(raw.guesses)) return null

  for (const g of raw.guesses) {
    if (
      typeof g !== 'string' ||
      g.length !== L ||
      !/^[a-z]+$/.test(g.toLowerCase())
    ) {
      return null
    }
  }

  const cur = raw.current
  if (typeof cur !== 'string' || cur.length > L) return null
  if (cur !== '' && !/^[A-Z]+$/.test(cur)) return null

  const st = raw.status
  if (st !== 'playing' && st !== 'won' && st !== 'lost' && st !== 'offer_ad') {
    return null
  }

  if (typeof raw.adBonus !== 'boolean') return null

  return {
    v: 1,
    answerLower: raw.answerLower,
    wordLength: raw.wordLength,
    guesses: raw.guesses.map((g) => g.toLowerCase()),
    current: cur,
    status: st,
    adBonus: raw.adBonus,
  }
}

export function clearWordleSession(id: string): void {
  try {
    localStorage.removeItem(storageKey(id))
  } catch {
    /* ignore */
  }
}
