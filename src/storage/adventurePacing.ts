import { loadJson, saveJson, keys } from './gameStorage'

export function loadAdventureRandomSeed(): number {
  const v = loadJson<number | null>(keys.adventureRandomSeed, null)
  if (v != null && typeof v === 'number' && v > 0) return v >>> 0
  const s = (Date.now() % 0x7fffffff) || 1
  saveJson(keys.adventureRandomSeed, s)
  return s
}

export function saveAdventureRandomSeed(n: number): void {
  saveJson(keys.adventureRandomSeed, n >>> 0)
}

/** 마지막 전면 광고(또는 쿨다운 기준 시각) 이후 경과 시간 기준 — ms */
export const ADVENTURE_INTERSTITIAL_MIN_GAP_MS = 120_000

export type AdventureInterstitialState = {
  /** 마지막 광고 직후부터 세는 완료 판 수. 2이면 '2판 조건' 충족, 시간만 기다리는 상태 */
  gamesSinceLastAd: 0 | 1 | 2
  lastInterstitialShownAt: number | null
}

type LegacyInterstitial = {
  completedMod2?: 0 | 1
}

function defaultInterstitialState(): AdventureInterstitialState {
  return { gamesSinceLastAd: 0, lastInterstitialShownAt: null }
}

function normalizeInterstitialRaw(
  raw: AdventureInterstitialState | LegacyInterstitial | null,
): AdventureInterstitialState {
  if (!raw) return defaultInterstitialState()

  if (
    typeof (raw as AdventureInterstitialState).gamesSinceLastAd === 'number'
  ) {
    const s = raw as AdventureInterstitialState
    const g = s.gamesSinceLastAd
    if (g !== 0 && g !== 1 && g !== 2) return defaultInterstitialState()
    return {
      gamesSinceLastAd: g,
      lastInterstitialShownAt:
        typeof s.lastInterstitialShownAt === 'number'
          ? s.lastInterstitialShownAt
          : null,
    }
  }

  const leg = raw as LegacyInterstitial
  if (leg.completedMod2 === 0 || leg.completedMod2 === 1) {
    return {
      gamesSinceLastAd: leg.completedMod2,
      lastInterstitialShownAt: null,
    }
  }

  return defaultInterstitialState()
}

export function loadAdventureInterstitialState(): AdventureInterstitialState {
  const raw = loadJson<AdventureInterstitialState | LegacyInterstitial | null>(
    keys.adventureInterstitial,
    null,
  )
  const next = normalizeInterstitialRaw(raw)
  const hadNewFormat =
    raw != null &&
    typeof (raw as AdventureInterstitialState).gamesSinceLastAd === 'number'
  if (!hadNewFormat) {
    saveJson(keys.adventureInterstitial, next)
    return next
  }
  const g = (raw as AdventureInterstitialState).gamesSinceLastAd
  if (g !== 0 && g !== 1 && g !== 2) {
    saveJson(keys.adventureInterstitial, next)
    return next
  }
  return raw as AdventureInterstitialState
}

export function saveAdventureInterstitialState(s: AdventureInterstitialState): void {
  saveJson(keys.adventureInterstitial, s)
}

function cooldownRefMs(
  lastInterstitialShownAt: number | null,
  sessionStartedAt: number,
): number {
  return lastInterstitialShownAt ?? sessionStartedAt
}

/** 다음 '2판' 조건까지 남은 완료 판 수. 2판 조건만 채우고 시간 대기 중이면 null */
export function playsUntilNextAd(s: AdventureInterstitialState): 1 | 2 | null {
  if (s.gamesSinceLastAd >= 2) return null
  return s.gamesSinceLastAd === 0 ? 2 : 1
}

/**
 * 하이브리드: (1) 완료 판 2판마다 + (2) 마지막 전면 광고(또는 이번 어드벤처 탭 진입) 이후 최소 2분.
 * 둘 다 만족할 때만 전면 광고.
 */
export function recordAdventureSessionComplete(args: {
  now: number
  /** 어드벤처 허브(코어) 마운트 시각 — 첫 광고 전 쿨다운 기준 */
  sessionStartedAt: number
}): { showInterstitial: boolean } {
  const s = loadAdventureInterstitialState()
  const ref = cooldownRefMs(s.lastInterstitialShownAt, args.sessionStartedAt)
  const minOk = args.now - ref >= ADVENTURE_INTERSTITIAL_MIN_GAP_MS
  let g = s.gamesSinceLastAd

  if (g >= 2) {
    if (minOk) {
      saveAdventureInterstitialState({
        gamesSinceLastAd: 1,
        lastInterstitialShownAt: args.now,
      })
      return { showInterstitial: true }
    }
    return { showInterstitial: false }
  }

  const gNext = g + 1
  if (gNext >= 2) {
    if (minOk) {
      saveAdventureInterstitialState({
        gamesSinceLastAd: 0,
        lastInterstitialShownAt: args.now,
      })
      return { showInterstitial: true }
    }
    saveAdventureInterstitialState({
      gamesSinceLastAd: 2,
      lastInterstitialShownAt: s.lastInterstitialShownAt,
    })
    return { showInterstitial: false }
  }

  saveAdventureInterstitialState({
    gamesSinceLastAd: gNext as 0 | 1,
    lastInterstitialShownAt: s.lastInterstitialShownAt,
  })
  return { showInterstitial: false }
}
