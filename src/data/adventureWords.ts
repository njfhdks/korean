import type { AdventureSpec } from './adventureBitmap'
import { wordLengthForStage } from './adventureBitmap'
import { pickAdventureUnusedWord, isWordMasterHardMode } from '../storage/wordUsage'

function specSalt(id: string): number {
  let s = 0
  for (let i = 0; i < id.length; i++) {
    s = (s * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(s)
}

/** 마스터 모드: 6글자 비중↑ */
export function wordLengthForStageMaster(
  idx: number,
  total: number,
): 4 | 5 | 6 {
  if (total <= 0) return 6
  const t = idx / Math.max(total - 1, 1)
  if (t < 0.08) return 4
  if (t < 0.2) return 5
  return 6
}

/** 사이드 이펙트 없음 — 렌더에서 길이만 필요할 때 */
export function getAdventureStageWordLength(
  spec: AdventureSpec,
  stageIndex: number,
): 4 | 5 | 6 {
  const n = spec.stageOrder.length
  if (isWordMasterHardMode()) {
    return wordLengthForStageMaster(stageIndex, n)
  }
  return wordLengthForStage(stageIndex, n)
}

export function getAdventureAnswer(
  spec: AdventureSpec,
  stageIndex: number,
): {
  word: string
  length: 4 | 5 | 6
} {
  const len = getAdventureStageWordLength(spec, stageIndex)
  const stableKey = `${spec.id}@${stageIndex}@${specSalt(spec.id)}`
  const word = pickAdventureUnusedWord(len, stableKey)
  const L = word.length
  if (L !== 4 && L !== 5 && L !== 6) {
    throw new Error(`Invalid adventure word length: ${word}`)
  }
  return { word, length: L }
}

export function pickAdventureRetryWord(
  len: 4 | 5 | 6,
  exclude: string,
): string {
  const ex = exclude.toLowerCase()
  let w = pickAdventureUnusedWord(
    len,
    `retry:${ex}:${Math.random().toString(36).slice(2)}`,
  )
  let guard = 0
  while (w === ex && guard < 48) {
    w = pickAdventureUnusedWord(len, `retry2:${ex}:${guard}:${Math.random()}`)
    guard += 1
  }
  return w
}
