const P = 'wordmap'

export const keys = {
  contributions: `${P}:contrib`,
  streak: `${P}:streak`,
  maxStreak: `${P}:max`,
  lastClear: `${P}:last`,
  adventure: `${P}:adv`,
  /** 어드벤처 전면 광고 간격 { completedMod2 } — 2판마다 광고 */
  adventureInterstitial: `${P}:adv:int`,
  /** 랜덤 비트맵 시드 */
  adventureRandomSeed: `${P}:adv:randSeed`,
  /** 어드벤처 단어 사용 사이클 / 마스터 플래그 */
  wordUsage: `${P}:adv:words`,
  /** base → mirror → invert → random */
  adventureCampaign: `${P}:adv:campaign`,
  /** 게임 효과음 볼륨 0~1 (기본 1) */
  sfxVolume: `${P}:sfx:vol`,
  /** 워드맵(구 어드벤처) 하트 { hearts, nextHeartAtMs } */
  mapHearts: `${P}:map:hearts`,
  /** 데일리: 로컬 날짜 YYYY-MM-DD — 하루 1회 플레이 잠금 */
  dailyLockedDay: `${P}:daily:lock`,
  /** 웹 전용: 어드벤처 완료 판(승/패) 수 — 앱에서는 사용 안 함 */
  adventureWebPlayCount: `${P}:adv:webPlays`,
} as const

/** 웹 브라우저에서 어드벤처 무료 플레이 횟수 상한 */
export const WEB_ADVENTURE_MAX_PLAYS = 3

export type ContribMap = Record<string, boolean>

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJson(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v))
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** 로컬 캘린더 기준 YYYY-MM-DD (데일리 잠금 등) */
export function localIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** `earlierYmd` ≤ `later` 의 로컬 달력 기준 일 수 차이 (같은 날 0, 다음 날 1). */
function localCalendarDaysAfter(earlierYmd: string, later: Date): number {
  const [y, m, day] = earlierYmd.split('-').map(Number)
  const a = new Date(y, m - 1, day).getTime()
  const b = startOfLocalDay(later).getTime()
  return Math.round((b - a) / 86400000)
}

export function hasLockedDailyToday(now?: Date): boolean {
  const d = now ?? new Date()
  const lock = loadJson<string | null>(keys.dailyLockedDay, null)
  return lock === localIsoDate(d)
}

export function lockDailyForToday(now?: Date): void {
  saveJson(keys.dailyLockedDay, localIsoDate(now ?? new Date()))
}

export function loadStreak() {
  return {
    current: loadJson<number>(keys.streak, 0),
    max: loadJson<number>(keys.maxStreak, 0),
    last: loadJson<string | null>(keys.lastClear, null),
  }
}

/** 데일리 패배 시 연속 일수만 0 (최고 기록·마지막 클리어일·캘린더는 유지) */
export function resetDailyStreakOnFail(): void {
  saveJson(keys.streak, 0)
}

export function loadAdventureWebPlayCount(): number {
  const n = loadJson<number>(keys.adventureWebPlayCount, 0)
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
    ? Math.min(999, Math.floor(n))
    : 0
}

/** 웹 어드벤처 1판(스테이지 승리 또는 패배 확정)마다 호출 */
export function incrementAdventureWebPlayCount(): number {
  const next = loadAdventureWebPlayCount() + 1
  saveJson(keys.adventureWebPlayCount, next)
  return next
}

export function recordDailyWin(today?: Date) {
  const d = today ?? new Date()
  const iso = localIsoDate(d)
  const last = loadJson<string | null>(keys.lastClear, null)
  let cur = loadJson<number>(keys.streak, 0)
  const max = loadJson<number>(keys.maxStreak, 0)

  if (last) {
    const gap = localCalendarDaysAfter(last, d)
    if (gap === 0) {
      /* already today (local) */
    } else if (gap === 1) {
      cur += 1
    } else {
      cur = 1
    }
  } else {
    cur = 1
  }

  saveJson(keys.streak, cur)
  saveJson(keys.maxStreak, Math.max(max, cur))
  saveJson(keys.lastClear, iso)

  const m = loadJson<ContribMap>(keys.contributions, {})
  m[iso] = true
  saveJson(keys.contributions, m)
}

export interface AdvProgress {
  mapId: string
  cleared: number[]
  /** 연속 스테이지 클리어(승리) — 2가 되면 보너스 1스테이지 추가 후 0. 패배 시 0 */
  consecutiveWins?: number
}

export function loadAdv(id: string): AdvProgress {
  const all = loadJson<Record<string, AdvProgress>>(keys.adventure, {})
  return all[id] ?? { mapId: id, cleared: [] }
}

export function saveAdv(p: AdvProgress) {
  const all = loadJson<Record<string, AdvProgress>>(keys.adventure, {})
  all[p.mapId] = p
  saveJson(keys.adventure, all)
}

export function loadSfxVolume(): number {
  const v = loadJson<unknown>(keys.sfxVolume, 1)
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(1, Math.max(0, n))
}

export function saveSfxVolume(volume01: number) {
  saveJson(keys.sfxVolume, Math.min(1, Math.max(0, volume01)))
}
