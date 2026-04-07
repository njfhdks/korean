import { loadJson, saveJson, keys } from './gameStorage'

export const MAP_HEART_MAX = 3
export const MAP_HEART_REGEN_MS = 30 * 60 * 1000

export type MapHeartsState = {
  hearts: number
  /** 다음 하트 1개 회복 시각(epoch ms). 로컬 저장 후 앱 종료·재실행해도 실시간이 흐르면 그대로 반영됨 */
  nextHeartAtMs: number | null
}

function normalize(raw: Partial<MapHeartsState>): MapHeartsState {
  let hearts =
    typeof raw.hearts === 'number' && Number.isFinite(raw.hearts)
      ? Math.floor(raw.hearts)
      : MAP_HEART_MAX
  hearts = Math.min(MAP_HEART_MAX, Math.max(0, hearts))
  const nextHeartAtMs =
    typeof raw.nextHeartAtMs === 'number' &&
    Number.isFinite(raw.nextHeartAtMs)
      ? raw.nextHeartAtMs
      : null
  return { hearts, nextHeartAtMs }
}

export function loadMapHeartsRaw(): MapHeartsState {
  return normalize(loadJson<Partial<MapHeartsState>>(keys.mapHearts, {}))
}

export function saveMapHeartsState(s: MapHeartsState): void {
  saveJson(keys.mapHearts, s)
}

/** 경과한 30분 슬롯만큼 하트 회복 반영 후 저장 */
export function applyMapHeartRegen(now: number = Date.now()): MapHeartsState {
  const raw = loadMapHeartsRaw()
  const s = tickMapHearts(raw, now)
  if (s.hearts !== raw.hearts || s.nextHeartAtMs !== raw.nextHeartAtMs) {
    saveMapHeartsState(s)
  }
  return s
}

export function tickMapHearts(
  s: MapHeartsState,
  now: number,
): MapHeartsState {
  let h = s.hearts
  let next = s.nextHeartAtMs
  while (h < MAP_HEART_MAX && next != null && now >= next) {
    h += 1
    if (h < MAP_HEART_MAX) {
      next = next + MAP_HEART_REGEN_MS
    } else {
      next = null
    }
  }
  if (h === s.hearts && next === s.nextHeartAtMs) return s
  return { hearts: h, nextHeartAtMs: next }
}

/**
 * 맵 모드에서 한 판 패배 확정 시 1 소모. 클리어 시 호출하지 않음.
 * 이미 0이면 그대로 두고 타이머만 유지.
 */
export function consumeMapHeartOnLoss(now: number = Date.now()): MapHeartsState {
  let s = tickMapHearts(loadMapHeartsRaw(), now)
  if (s.hearts <= 0) {
    saveMapHeartsState(s)
    return s
  }
  s = { ...s, hearts: s.hearts - 1 }
  if (s.hearts < MAP_HEART_MAX && s.nextHeartAtMs == null) {
    s = { ...s, nextHeartAtMs: now + MAP_HEART_REGEN_MS }
  }
  saveMapHeartsState(s)
  return s
}

export function formatHeartCountdownMs(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
