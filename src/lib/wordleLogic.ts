export type TileState = 'correct' | 'present' | 'absent' | 'empty'

export function evaluateGuess(answer: string, guess: string): TileState[] {
  const a = answer.toLowerCase()
  const g = guess.toLowerCase()
  if (a.length !== g.length) {
    throw new Error('Guess length must match answer length')
  }
  const n = a.length
  const result: TileState[] = Array.from({ length: n }, () => 'absent')
  const remaining = new Map<string, number>()
  for (const ch of a) {
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1)
  }
  for (let i = 0; i < n; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct'
      const c = g[i]!
      remaining.set(c, (remaining.get(c) ?? 0) - 1)
    }
  }
  for (let i = 0; i < n; i++) {
    if (result[i] === 'correct') continue
    const c = g[i]!
    const left = remaining.get(c) ?? 0
    if (left > 0) {
      result[i] = 'present'
      remaining.set(c, left - 1)
    }
  }
  return result
}

export function isWin(states: TileState[]): boolean {
  return states.length > 0 && states.every((s) => s === 'correct')
}
