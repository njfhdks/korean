import type { TileState } from './wordleLogic'
import { loadSfxVolume } from '../storage/gameStorage'

/** C4 기준 장음계 도~시 (Hz) — 초록 칸마다 한 음씩 올림 */
const C_MAJOR: readonly number[] = [
  261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25,
]

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new AC()
    }
    return sharedCtx
  } catch {
    return null
  }
}

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  volume01: number,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  const peak = 0.1 * volume01
  const floor = 0.0001
  const attack = 0.022
  const body = 0.14
  const release = 0.3
  const t0 = startTime
  const tPeak = t0 + attack
  const tBodyEnd = tPeak + body
  const tEnd = tBodyEnd + release

  gain.gain.setValueAtTime(floor, t0)
  gain.gain.exponentialRampToValueAtTime(peak, tPeak)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(peak * 0.45, floor * 4),
    tBodyEnd,
  )
  gain.gain.linearRampToValueAtTime(floor, tEnd)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(tEnd + 0.03)
}

/**
 * 제출한 줄에서 초록(correct)인 칸만, 왼쪽부터 도·레·미·파… 로 재생.
 * 뒤집기 애니메이션 지연과 맞춤 (일반 80ms, 승리 줄 220ms).
 */
export function playGreenCorrectArpeggio(
  states: TileState[],
  winRow: boolean,
): void {
  const vol = loadSfxVolume()
  if (vol <= 0) return

  const ctx = getCtx()
  if (!ctx) return
  void ctx.resume().catch(() => {})

  const stepMs = winRow ? 220 : 80
  const base = ctx.currentTime
  let degree = 0

  for (let ci = 0; ci < states.length; ci++) {
    if (states[ci] !== 'correct') continue
    const freq = C_MAJOR[degree % C_MAJOR.length]!
    const t0 = base + (ci * stepMs) / 1000
    scheduleTone(ctx, freq, t0, vol)
    degree += 1
  }
}
