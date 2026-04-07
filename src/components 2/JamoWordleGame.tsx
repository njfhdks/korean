import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  evaluateJamoGuess,
  isWinningResult,
  jamoSlotCount,
  tryAssembleJamo,
  wordToJamo,
  type JamoTileState,
} from '../lib/jamoWordle'
import {
  assembledMatchesJamo,
  pickRandomNoun,
  syllableLength,
  wordCheck,
} from '../data/nouns'
import { HangulKeyboard } from './HangulKeyboard'
import { CODE_TO_JAMO } from '../lib/physicalHangulMap'
import { ALLOWED_GAME_JAMO } from '../lib/allowedJamo'

export type GamePlayStatus = 'playing' | 'won' | 'lost' | 'offer_ad'

type Props = {
  syllables: 2 | 3 | 4
  gameKey: string | number
  onWin: () => void
  allowRewardAd?: boolean
  /** 패배(광고 거절 또는 9번째 실패) 시 — 어드벤처에서 새 단어로 교체 */
  onLose?: () => void
  className?: string
}

const FLIP_MS = 70

function tileStyle(st: JamoTileState | undefined): string {
  const base =
    'flex aspect-square min-w-[1.5rem] max-w-[2.75rem] flex-1 items-center justify-center rounded-xl text-sm font-bold shadow-inner sm:text-base border-2 '
  if (!st) {
    return `${base} border-slate-500 bg-slate-800 text-slate-100`
  }
  if (st === 'correct')
    return `${base} border-cyan-300 bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.45)]`
  if (st === 'present')
    return `${base} border-amber-300 bg-amber-400 text-slate-950`
  return `${base} border-slate-600 bg-slate-600 text-slate-100`
}

export function JamoWordleGame({
  syllables,
  gameKey,
  onWin,
  allowRewardAd = true,
  onLose,
  className = '',
}: Props) {
  const answer = useMemo(
    () => pickRandomNoun(syllables),
    [syllables, gameKey],
  )
  const answerJamo = useMemo(() => wordToJamo(answer), [answer])
  const jamoLen = answerJamo.length

  const maxBase = 6
  const [adBonus, setAdBonus] = useState(false)
  const maxGuesses = adBonus ? 9 : maxBase

  const [guesses, setGuesses] = useState<string[][]>([])
  const [results, setResults] = useState<JamoTileState[][]>([])
  const [current, setCurrent] = useState<string[]>([])
  const [status, setStatus] = useState<GamePlayStatus>('playing')
  const [shake, setShake] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [revealTick, setRevealTick] = useState(0)

  const currentRef = useRef(current)
  const statusRef = useRef(status)
  currentRef.current = current
  statusRef.current = status

  useEffect(() => {
    setAdBonus(false)
    setGuesses([])
    setResults([])
    setCurrent([])
    setStatus('playing')
    setErrorMsg(null)
  }, [gameKey, syllables])

  const submitRow = useCallback(() => {
    setErrorMsg(null)
    const row = [...currentRef.current]
    if (row.length !== jamoLen) {
      setErrorMsg('글자 수가 부족합니다')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    const assembled = tryAssembleJamo(row)
    if (!assembledMatchesJamo(assembled, row)) {
      setErrorMsg('자모가 올바른 한글로 이어지지 않습니다.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    if (syllableLength(assembled) !== syllables) {
      setErrorMsg('음절 수가 맞지 않습니다.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    if (!wordCheck(assembled, syllables)) {
      setErrorMsg('사전에 없는 단어입니다.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    const states = evaluateJamoGuess(answerJamo, row)
    const used = guesses.length + 1

    setGuesses((g) => [...g, [...row]])
    setResults((r) => [...r, states])
    setCurrent([])
    setRevealTick((t) => t + 1)

    if (isWinningResult(states)) {
      setStatus('won')
      onWin()
      return
    }

    if (used === maxBase && !adBonus && allowRewardAd) {
      setStatus('offer_ad')
      return
    }

    const limit = adBonus ? 9 : maxBase
    if (used >= limit) {
      setStatus('lost')
      onLose?.()
    }
  }, [
    jamoLen,
    syllables,
    answerJamo,
    guesses.length,
    adBonus,
    allowRewardAd,
    maxBase,
    onWin,
    onLose,
  ])

  const submitRef = useRef(submitRow)
  submitRef.current = submitRow

  const pushJamo = useCallback((j: string) => {
    if (statusRef.current !== 'playing') return
    if (!ALLOWED_GAME_JAMO.has(j)) return
    setLastKey(j)
    window.setTimeout(() => setLastKey(null), 120)
    setCurrent((c) => {
      if (c.length >= jamoLen) return c
      return [...c, j]
    })
  }, [jamoLen])

  const onBackspace = useCallback(() => {
    if (statusRef.current !== 'playing') return
    setCurrent((c) => c.slice(0, -1))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.repeat) return

      if (e.code === 'Backspace') {
        e.preventDefault()
        onBackspace()
        return
      }

      if (e.code === 'Enter') {
        e.preventDefault()
        submitRef.current()
        return
      }

      if (e.shiftKey) return

      const fromCode = CODE_TO_JAMO[e.code]
      if (fromCode && ALLOWED_GAME_JAMO.has(fromCode)) {
        e.preventDefault()
        pushJamo(fromCode)
        return
      }

      if (e.key.length === 1 && ALLOWED_GAME_JAMO.has(e.key)) {
        e.preventDefault()
        pushJamo(e.key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [jamoLen, onBackspace, pushJamo])

  const acceptAd = () => {
    console.log('[REWARD AD] 시청 완료 → 시도 3회 추가')
    setAdBonus(true)
    setStatus('playing')
  }

  const declineAd = () => {
    setStatus('lost')
    onLose?.()
  }

  const rowFilled = current.length === jamoLen && jamoLen > 0

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <p className="text-center text-xs text-slate-400">
        정답 음절 {syllables}글자 · 자모 {jamoSlotCount(answer)}칸
      </p>

      <div
        className={`flex w-full max-w-md flex-col gap-2 px-1 ${shake ? 'animate-pulse' : ''}`}
      >
        {Array.from({ length: maxGuesses }, (_, ri) => {
          const isActiveRow =
            ri === guesses.length && status === 'playing'
          return (
            <div
              key={`${revealTick}-${ri}`}
              className={`flex justify-center gap-1.5 rounded-xl p-1.5 transition ${
                isActiveRow
                  ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950'
                  : ''
              }`}
            >
              {Array.from({ length: jamoLen }, (_, ci) => {
                const letter =
                  ri < guesses.length
                    ? guesses[ri]![ci]
                    : ri === guesses.length
                      ? current[ci]
                      : null
                const st = ri < guesses.length ? results[ri]![ci] : undefined
                const isEmptyFuture = ri > guesses.length
                const isCurrentRow = isActiveRow
                const delay = ci * FLIP_MS
                return (
                  <div
                    key={ci}
                    style={
                      ri < guesses.length
                        ? { animationDelay: `${delay}ms` }
                        : undefined
                    }
                    className={
                      isEmptyFuture
                        ? 'flex aspect-square min-w-[1.5rem] max-w-[2.75rem] flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/80 text-transparent sm:text-base'
                        : `${tileStyle(st)} ${ri < guesses.length ? 'jamo-flip-cell' : ''} ${isCurrentRow && letter ? 'jamo-pop' : ''}`
                    }
                  >
                    {letter ?? ''}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {errorMsg && (
        <p className="text-sm font-medium text-rose-400" role="alert">
          {errorMsg}
        </p>
      )}

      {status === 'won' && (
        <p className="text-lg font-bold text-cyan-400">정답! {answer}</p>
      )}
      {status === 'lost' && (
        <p className="text-center text-sm text-slate-400">
          정답은{' '}
          <span className="font-bold text-slate-100">{answer}</span>였습니다.
        </p>
      )}

      {/* 확인: 항상 눈에 띄게 — 칸이 다 찼을 때만 활성 */}
      <div className="w-full max-w-md px-1">
        <button
          type="button"
          disabled={status !== 'playing'}
          onClick={() => submitRow()}
          className={`w-full rounded-2xl py-4 text-lg font-black tracking-wide shadow-lg transition sm:py-5 sm:text-xl ${
            status === 'playing' && rowFilled
              ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-slate-950 shadow-sky-500/30 hover:brightness-110 active:scale-[0.99]'
              : status === 'playing'
                ? 'bg-slate-800 text-slate-300 ring-1 ring-slate-600 hover:bg-slate-700 active:scale-[0.99]'
                : 'cursor-not-allowed bg-slate-900 text-slate-600 ring-1 ring-slate-800'
          }`}
        >
          확인 (Enter)
        </button>
        {status === 'playing' && !rowFilled && (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            자모 {jamoLen}칸을 채운 뒤 확인하세요. (부족하면 메시지가 뜹니다)
          </p>
        )}
      </div>

      <HangulKeyboard
        disabled={status !== 'playing'}
        lastKey={lastKey}
        onJamo={pushJamo}
        onBackspace={onBackspace}
      />

      {status === 'offer_ad' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-sm rounded-2xl border border-slate-600 bg-slate-900 p-6 text-center shadow-2xl ring-1 ring-sky-500/20">
            <p className="text-lg font-bold text-slate-50">기회 6번을 모두 썼어요</p>
            <p className="mt-2 text-sm text-slate-400">
              짧은 광고를 보면 <strong className="text-sky-400">3번</strong> 더
              도전할 수 있어요.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3.5 font-bold text-slate-950 shadow-lg"
                onClick={acceptAd}
              >
                광고 보고 +3회
              </button>
              <button
                type="button"
                className="rounded-xl bg-slate-800 py-2.5 text-sm text-slate-300 ring-1 ring-slate-600"
                onClick={declineAd}
              >
                그만하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
