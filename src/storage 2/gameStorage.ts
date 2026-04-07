const PREFIX = 'korean-kkoddle'

export const storageKeys = {
  contributions: `${PREFIX}:contributions`,
  streak: `${PREFIX}:streak`,
  maxStreak: `${PREFIX}:max-streak`,
  lastClearDate: `${PREFIX}:last-clear`,
  adventure: `${PREFIX}:adventure`,
} as const

export type ContributionsMap = Record<string, boolean>

export interface AdventureProgress {
  mapId: string
  /** 클리어한 스테이지 인덱스 집합 */
  cleared: number[]
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function loadContributions(): ContributionsMap {
  return loadJson<ContributionsMap>(storageKeys.contributions, {})
}

export function markContribution(date: Date) {
  const key = toISODate(date)
  const map = loadContributions()
  map[key] = true
  saveJson(storageKeys.contributions, map)
}

export function loadStreak(): { current: number; max: number; last: string | null } {
  return {
    current: loadJson<number>(storageKeys.streak, 0),
    max: loadJson<number>(storageKeys.maxStreak, 0),
    last: loadJson<string | null>(storageKeys.lastClearDate, null),
  }
}

/** 데일리 클리어 시 호출: 연속 일수 갱신 */
export function recordDailyClear(today: Date = new Date()) {
  const iso = toISODate(today)
  const { last } = loadStreak()
  let current = loadJson<number>(storageKeys.streak, 0)
  const max = loadJson<number>(storageKeys.maxStreak, 0)

  if (last) {
    const prev = new Date(last + 'T12:00:00')
    const diffDays = Math.floor(
      (today.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
    )
    if (diffDays === 0) {
      // 이미 오늘 처리됨
    } else if (diffDays === 1) {
      current += 1
    } else {
      current = 1
    }
  } else {
    current = 1
  }

  const nextMax = Math.max(max, current)
  saveJson(storageKeys.streak, current)
  saveJson(storageKeys.maxStreak, nextMax)
  saveJson(storageKeys.lastClearDate, iso)
  markContribution(today)
}

export function loadAdventure(mapId: string): AdventureProgress {
  const all = loadJson<Record<string, AdventureProgress>>(storageKeys.adventure, {})
  return all[mapId] ?? { mapId, cleared: [] }
}

export function saveAdventureProgress(p: AdventureProgress) {
  const all = loadJson<Record<string, AdventureProgress>>(storageKeys.adventure, {})
  all[p.mapId] = p
  saveJson(storageKeys.adventure, all)
}
