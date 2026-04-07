import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Home, Loader2 } from 'lucide-react'
import { evaluateGuess, isWin, type TileState } from '../lib/wordleLogic'
import { playGreenCorrectArpeggio } from '../lib/wordleSfx'
import {
  saveWordleSession,
  loadWordleSession,
  type WordleSessionSnapshot,
} from '../lib/wordleSession'
import { lookupEnglishWord } from '../lib/dictionaryApi'
import { useI18n } from '../context/I18nContext'
import { usePipKeyboardSurfaceKey } from '../context/PipKeyboardSurfaceContext'
import { QwertyKeyboard } from './QwertyKeyboard'
import { Toast } from './Toast'
import { WinConfetti } from './WinConfetti'

type GameStatus = 'playing' | 'won' | 'lost' | 'offer_ad'

type Props = {
  answer: string
  wordLength: 4 | 5 | 6
  gameKey: string | number
  onWin: () => void
  /** 기회 소진 등으로 패배 확정 시 1회 (복원된 패배 화면에서는 호출하지 않음) */
  onLose?: () => void
  /** 패배 후 재도전 — 새 정답으로 이어하기. `false`면 재도전 취소(예: 일일 한도) */
  onRetry?: () => boolean | void
  allowAd?: boolean
  /** 허브로 나가기 (전달 시 상단에 홈 표시). `session_end`는 패배 후 종료(전면 광고 등과 연동) */
  onHome?: (source?: 'default' | 'session_end') => void
  /** 툴바 부제 (예: 스테이지 3) */
  toolbarSubtitle?: string
  /** 툴바 오른쪽 (예: Document PiP 버튼) */
  toolbarExtraRight?: ReactNode
  /** 이 값으로 localStorage에 진행 상황 저장·복원 (허브로 나갔다 와도 이어하기) */
  persistKey?: string
  /** true면 패배 화면 안내 문구(재도전 언급 등) 숨김 — 데일리용 */
  omitLoseHint?: boolean
}

const MAX_BASE = 6
/** 광고 시청 후 추가 기회 (6 + 3 = 9회) */
const MAX_WITH_AD = 9

/** iOS system green / yellow / gray 계열 (+ 다크 대비) */
function tileClass(st: TileState | undefined, revealed: boolean): string {
  const base =
    'flex aspect-square max-h-14 min-h-12 min-w-10 max-w-14 items-center justify-center rounded-[6px] border text-[20px] font-semibold uppercase sm:min-h-14 sm:min-w-12 sm:text-[22px] '
  if (!revealed || st === 'empty' || !st) {
    return (
      base +
      'border-white/55 bg-white/50 text-[#000000] backdrop-blur-sm dark:border-white/15 dark:bg-white/10 dark:text-white'
    )
  }
  if (st === 'correct') {
    return base + 'border-[#248A3D] bg-[#34C759] text-white dark:border-[#30D158] dark:bg-[#30D158]'
  }
  if (st === 'present') {
    return base + 'border-[#C9A227] bg-[#FFD60A] text-[#000000] dark:bg-[#FFD60A] dark:text-black'
  }
  return base +
    'border-[#AEAEB2] bg-[#D1D1D6] text-[#000000] dark:border-[#636366] dark:bg-[#48484A] dark:text-white'
}

export function WordleGame({
  answer,
  wordLength,
  gameKey: _gameKey,
  onWin,
  onLose,
  onRetry,
  allowAd = true,
  onHome,
  toolbarSubtitle,
  toolbarExtraRight,
  persistKey,
  omitLoseHint = false,
}: Props) {
  const { t } = useI18n()
  const pipKeyboardSurfaceKey = usePipKeyboardSurfaceKey()
  const L = wordLength
  const answerLower = answer.toLowerCase()

  const bundle = useMemo(() => {
    if (!persistKey) {
      return {
        guesses: [] as string[],
        results: [] as TileState[][],
        current: '',
        status: 'playing' as GameStatus,
        adBonus: false,
      }
    }
    const s = loadWordleSession(persistKey, answerLower, L)
    if (!s) {
      return {
        guesses: [] as string[],
        results: [] as TileState[][],
        current: '',
        status: 'playing' as GameStatus,
        adBonus: false,
      }
    }
    const results = s.guesses.map((g) => evaluateGuess(answerLower, g))
    return {
      guesses: s.guesses,
      results,
      current: s.current,
      status: s.status as GameStatus,
      adBonus: s.adBonus,
    }
  }, [persistKey, answerLower, L])

  const [adBonus, setAdBonus] = useState(bundle.adBonus)
  const maxRows = adBonus ? MAX_WITH_AD : MAX_BASE

  const [guesses, setGuesses] = useState(bundle.guesses)
  const [results, setResults] = useState(bundle.results)
  const [current, setCurrent] = useState(bundle.current)
  const [status, setStatus] = useState<GameStatus>(bundle.status)
  const [shake, setShake] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [flip, setFlip] = useState(0)
  const [checking, setChecking] = useState(false)
  /** 막 정답 맞춘 직후에만 슬로우 플립·컨페티 (복원된 승리 제외) */
  const [celebrateWin, setCelebrateWin] = useState(false)
  const submittingRef = useRef(false)

  const currentRef = useRef(current)
  const statusRef = useRef(status)
  const guessesRef = useRef(guesses)
  const checkingRef = useRef(checking)
  const tRef = useRef(t)
  currentRef.current = current
  statusRef.current = status
  guessesRef.current = guesses
  checkingRef.current = checking
  tRef.current = t

  useEffect(() => {
    setAdBonus(bundle.adBonus)
    setGuesses(bundle.guesses)
    setResults(bundle.results)
    setCurrent(bundle.current)
    setStatus(bundle.status)
    setToast(null)
    setChecking(false)
    setCelebrateWin(false)
    submittingRef.current = false
    setFlip((x) => x + 1)
  }, [bundle])

  useEffect(() => {
    if (!persistKey) return
    const snap: WordleSessionSnapshot = {
      v: 1,
      answerLower,
      wordLength: L,
      guesses,
      current,
      status,
      adBonus,
    }
    saveWordleSession(persistKey, snap)
  }, [persistKey, answerLower, L, guesses, current, status, adBonus])

  const applyGuess = useCallback(
    (g: string) => {
      const states = evaluateGuess(answerLower, g)
      const used = guessesRef.current.length + 1

      setGuesses((prev) => [...prev, g])
      setResults((prev) => [...prev, states])
      setCurrent('')
      setFlip((x) => x + 1)

      const won = isWin(states)
      playGreenCorrectArpeggio(states, won)

      if (won) {
        setCelebrateWin(true)
        setStatus('won')
        onWin()
        window.setTimeout(() => setCelebrateWin(false), 4200)
        return
      }

      if (used === MAX_BASE && !adBonus && allowAd) {
        setStatus('offer_ad')
        return
      }

      if (used >= (adBonus ? MAX_WITH_AD : MAX_BASE)) {
        setStatus('lost')
        onLose?.()
      }
    },
    [answerLower, adBonus, allowAd, onWin, onLose],
  )

  const submit = useCallback(async () => {
    if (submittingRef.current) return
    setToast(null)
    const g = currentRef.current.toLowerCase()
    if (g.length !== L) {
      setToast(t('fillLetters'))
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    if (!/^[a-z]+$/.test(g)) {
      setToast(t('lettersOnly'))
      return
    }

    submittingRef.current = true
    setChecking(true)
    try {
      const result = await lookupEnglishWord(g)
      if (result === 'not_found') {
        setToast(t('notInList'))
        setShake(true)
        setTimeout(() => setShake(false), 400)
        return
      }
      if (result === 'error') {
        setToast(t('dictError'))
        return
      }
      applyGuess(g)
    } finally {
      submittingRef.current = false
      setChecking(false)
    }
  }, [L, applyGuess, t])

  const submitRef = useRef(submit)
  submitRef.current = submit

  const pushLetter = useCallback(
    (ch: string) => {
      if (statusRef.current !== 'playing' || checking) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      setCurrent((s) => (s.length >= L ? s : s + c))
    },
    [L, checking],
  )

  const back = useCallback(() => {
    if (statusRef.current !== 'playing' || checking) return
    setCurrent((s) => s.slice(0, -1))
  }, [checking])

  const pushLetterRef = useRef(pushLetter)
  pushLetterRef.current = pushLetter
  const backRef = useRef(back)
  backRef.current = back

  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = rootRef.current
    const win = el?.ownerDocument.defaultView ?? window
    const onDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing' || checkingRef.current) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        backRef.current()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (currentRef.current.length !== L) {
          setToast(tRef.current('fillLetters'))
          return
        }
        void submitRef.current()
        return
      }
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault()
        pushLetterRef.current(e.key.toUpperCase())
      }
    }
    win.addEventListener('keydown', onDown)
    return () => win.removeEventListener('keydown', onDown)
  }, [pipKeyboardSurfaceKey, L])

  const handleHome = useCallback(() => {
    if (
      onHome &&
      !persistKey &&
      statusRef.current === 'playing' &&
      guessesRef.current.length > 0
    ) {
      const ok = window.confirm(t('confirmLeaveGame'))
      if (!ok) return
    }
    onHome?.('default')
  }, [onHome, persistKey, t])

  const letterHints = useMemo(() => {
    const m: Partial<Record<string, 'correct' | 'present' | 'absent'>> = {}
    const rank = (t: TileState) =>
      t === 'correct' ? 3 : t === 'present' ? 2 : 1
    for (let r = 0; r < guesses.length; r++) {
      const row = guesses[r]!
      const res = results[r]!
      for (let i = 0; i < row.length; i++) {
        const ch = row[i]!.toUpperCase()
        const t = res[i]!
        const prev = m[ch]
        const pr = prev
          ? prev === 'correct'
            ? 3
            : prev === 'present'
              ? 2
              : 1
          : 0
        if (rank(t) > pr) {
          m[ch] =
            t === 'correct' ? 'correct' : t === 'present' ? 'present' : 'absent'
        }
      }
    }
    return m
  }, [guesses, results])

  const acceptAd = () => {
    console.log('[AD] Reward: +3 attempts')
    setAdBonus(true)
    setStatus('playing')
  }

  const declineAd = () => {
    setStatus('lost')
    onLose?.()
  }

  const rowFilled = current.length === L
  const canEnter = rowFilled && status === 'playing' && !checking

  const dismissToast = useCallback(() => setToast(null), [])

  const winRowIdx = status === 'won' ? guesses.length - 1 : -1

  return (
    <div
      ref={rootRef}
      className="relative flex w-full max-w-xl flex-col items-center gap-4"
    >
      <WinConfetti show={celebrateWin && status === 'won'} />
      <Toast message={toast} onDismiss={dismissToast} />

      {onHome && status !== 'lost' && (
        <div className="relative flex w-full max-w-xl items-center justify-center border-b border-white/30 pb-3 dark:border-white/[0.1]">
          <button
            type="button"
            onClick={handleHome}
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#007AFF] active:opacity-50 dark:text-[#0A84FF]"
            aria-label={t('ariaHomeHub')}
          >
            <Home className="h-[22px] w-[22px]" strokeWidth={2.2} />
          </button>
          {toolbarSubtitle && (
            <p className="max-w-[min(100%,18rem)] px-12 text-center text-[13px] font-medium text-[#6b7280] dark:text-white/55">
              {toolbarSubtitle}
            </p>
          )}
          {toolbarExtraRight ? (
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
              {toolbarExtraRight}
            </div>
          ) : null}
        </div>
      )}

      <div
        className={`flex w-full flex-col gap-1.5 px-2 ${shake ? 'animate-pulse' : ''}`}
      >
        {Array.from({ length: maxRows }, (_, ri) => (
          <div
            key={`${flip}-${ri}`}
            className="flex justify-center gap-1.5"
          >
            {Array.from({ length: L }, (_, ci) => {
              const letter =
                ri < guesses.length
                  ? guesses[ri]![ci]
                  : ri === guesses.length
                    ? current[ci]
                    : ''
              const st =
                ri < guesses.length ? results[ri]![ci] : undefined
              const revealed = ri < guesses.length
              const active = ri === guesses.length && status === 'playing'
              const isWinRow = winRowIdx >= 0 && ri === winRowIdx
              const useWinFlip = celebrateWin && isWinRow && revealed
              const delay = revealed
                ? useWinFlip
                  ? ci * 220
                  : ci * 80
                : undefined
              const flipCls = revealed
                ? useWinFlip
                  ? 'tile-flip-win'
                  : isWinRow && status === 'won' && !celebrateWin
                    ? ''
                    : 'tile-flip'
                : ''
              return (
                <div
                  key={ci}
                  style={revealed ? { animationDelay: `${delay}ms` } : undefined}
                  className={`${tileClass(st, revealed)} ${flipCls} ${active && letter ? 'tile-bounce' : ''}`}
                >
                  {letter || ''}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {status === 'won' && (
        <p
          className={`text-[17px] font-semibold text-[#34C759] dark:text-[#30D158] ${
            celebrateWin ? 'win-text-reveal opacity-0' : ''
          }`}
          style={
            celebrateWin
              ? { animationDelay: `${Math.min(L * 220 + 1050, 2200)}ms` }
              : undefined
          }
        >
          {t('winMessage', { word: answer })}
        </p>
      )}
      {status === 'lost' && (
        <div className="glass-panel w-full max-w-sm space-y-4 p-5 text-center">
          <p className="text-[13px] font-medium text-[#64748b] dark:text-[#8E8E93]">
            {t('answerLabel')}
          </p>
          <p className="text-[26px] font-bold tracking-[0.2em] text-[#0f172a] dark:text-white">
            {answer.toUpperCase()}
          </p>
          {!omitLoseHint && (
            <p className="text-[12px] leading-snug text-[#64748b] dark:text-[#8E8E93]">
              {t('loseHint')}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-center">
            {onRetry && (
              <button
                type="button"
                onClick={() => {
                  const ok = onRetry()
                  if (ok === false) {
                    setToast(t('noAttemptsLeft'))
                  }
                }}
                className="w-full rounded-[12px] bg-[#007AFF] py-3.5 text-[17px] font-semibold text-white active:bg-[#0066D6] dark:bg-[#0A84FF] sm:flex-1"
              >
                {t('retry')}
              </button>
            )}
            {onHome && (
              <button
                type="button"
                onClick={() => onHome('session_end')}
                className="w-full rounded-[12px] border border-[#C6C6C8] bg-white py-3.5 text-[17px] font-semibold text-[#007AFF] active:bg-[#E5E5EA] dark:border-[#48484A] dark:bg-[#3A3A3C] dark:text-[#0A84FF] sm:flex-1"
              >
                {t('home')}
              </button>
            )}
          </div>
        </div>
      )}

      {status !== 'lost' && (
        <>
          <button
            type="button"
            disabled={!canEnter}
            onClick={() => void submitRef.current()}
            className={`flex w-full max-w-sm items-center justify-center gap-2 rounded-[12px] py-3.5 text-[17px] font-semibold transition active:scale-[0.99] ${
              canEnter
                ? 'bg-[#007AFF] text-white active:bg-[#0066D6] dark:bg-[#0A84FF] dark:active:bg-[#0076E4]'
                : 'cursor-not-allowed bg-[#E5E5EA] text-[#C7C7CC] dark:bg-[#2C2C2E] dark:text-[#48484A]'
            }`}
          >
            {checking ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin opacity-90" aria-hidden />
                <span>{t('checking')}</span>
              </>
            ) : (
              t('enter')
            )}
          </button>
          {checking && (
            <p className="text-center text-[13px] text-[#8E8E93]">
              {t('verifyingDict')}
            </p>
          )}
          {!canEnter && !checking && status === 'playing' && (
            <p className="text-center text-[11px] text-[#8E8E93]">
              {t('typeNForEnter', { n: L })}
            </p>
          )}

          <QwertyKeyboard
            disabled={status !== 'playing' || checking}
            canSubmit={canEnter}
            letterHints={letterHints}
            onKey={pushLetter}
            onEnter={() => void submitRef.current()}
            onBackspace={back}
          />
        </>
      )}

      {status === 'offer_ad' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-5 backdrop-blur-md dark:bg-black/55">
          <div className="glass-panel w-full max-w-sm text-center shadow-2xl">
            <div className="border-b border-black/10 px-4 pt-5 pb-4 dark:border-white/[0.1]">
              <p className="text-[17px] font-semibold text-[#0f172a] dark:text-white">
                {t('outOfGuesses')}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-[#64748b] dark:text-[#8E8E93]">
                {t('watchAdHint')}
              </p>
            </div>
            <div className="divide-y divide-white/30 dark:divide-white/[0.08]">
              <button
                type="button"
                className="w-full bg-white/30 py-3.5 text-[17px] font-semibold text-[#007AFF] backdrop-blur-sm active:bg-white/45 dark:bg-white/5 dark:text-[#0A84FF] dark:active:bg-white/10"
                onClick={acceptAd}
              >
                {t('watchAd')}
              </button>
              <button
                type="button"
                className="w-full bg-white/20 py-3.5 text-[17px] font-normal text-[#007AFF] backdrop-blur-sm active:bg-white/35 dark:bg-white/5 dark:text-[#0A84FF] dark:active:bg-white/10"
                onClick={declineAd}
              >
                {t('endWithoutAd')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
