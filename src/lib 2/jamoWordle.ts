import Hangul from 'hangul-js'

/**
 * 게임에서 제외: 쌍자음 + ㅒ/ㅖ
 * 전역 플래그 없음 — 반복 .test() 시 lastIndex 문제 없음
 */
export const FORBIDDEN_JAMO_REGEX = /[ㄲㄸㅃㅆㅉㅒㅖ]/

export function hasForbiddenJamoInWord(word: string): boolean {
  const raw = Hangul.disassemble(word) as string[]
  return raw.some((ch) => ch.search(FORBIDDEN_JAMO_REGEX) !== -1)
}

/**
 * hangul-js disassemble 후 금지 자모(정규식) 검사 — 걸리면 예외.
 * 사전은 hasForbiddenJamoInWord로 선필터.
 */
export function wordToJamo(word: string): string[] {
  const raw = Hangul.disassemble(word) as string[]
  for (const ch of raw) {
    if (ch.search(FORBIDDEN_JAMO_REGEX) !== -1) {
      throw new Error(
        `[wordToJamo] 허용되지 않는 자모가 포함된 단어입니다: ${word}`,
      )
    }
  }
  return raw
}

/** 한 글자(음절)당 자모 수는 가변 — 전체 단어는 자모 1차원 배열로 비교 */
export type JamoTileState = 'correct' | 'present' | 'absent' | 'empty'

export function evaluateJamoGuess(
  answerJamo: readonly string[],
  guessJamo: readonly string[],
): JamoTileState[] {
  if (answerJamo.length !== guessJamo.length) {
    throw new Error(
      `자모 길이 불일치: 답 ${answerJamo.length}, 추측 ${guessJamo.length}`,
    )
  }
  const n = answerJamo.length
  const result: JamoTileState[] = Array.from({ length: n }, () => 'absent')
  const remaining = new Map<string, number>()
  for (const j of answerJamo) {
    remaining.set(j, (remaining.get(j) ?? 0) + 1)
  }

  for (let i = 0; i < n; i++) {
    if (guessJamo[i] === answerJamo[i]) {
      result[i] = 'correct'
      const c = guessJamo[i]
      remaining.set(c, (remaining.get(c) ?? 0) - 1)
    }
  }

  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue
    const c = guessJamo[i]
    const left = remaining.get(c) ?? 0
    if (left > 0) {
      result[i] = 'present'
      remaining.set(c, left - 1)
    }
  }

  return result
}

export function countHangulSyllables(word: string): number {
  const t = word.replace(/\s/g, '')
  return [...t].filter((ch) => Hangul.isHangul(ch)).length
}

export function jamoSlotCount(word: string): number {
  return wordToJamo(word).length
}

export function tryAssembleJamo(jamo: string[]): string {
  return Hangul.assemble([...jamo])
}

export function isWinningResult(states: JamoTileState[]): boolean {
  return states.length > 0 && states.every((s) => s === 'correct')
}
