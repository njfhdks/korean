import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Play,
} from 'lucide-react'
import {
  createRandomAdventureSpec,
  type AdventureSpec,
} from '../data/adventureBitmap'
import { loadPixelAdventureCatalog } from '../data/pixelAdventureCatalog'
import { getAdventureAnswer, pickAdventureRetryWord } from '../data/adventureWords'
import {
  getCatalogForPhase,
  loadCampaignPhase,
  tryAdvanceCampaignPhase,
} from '../storage/adventureCampaign'
import {
  incrementAdventureWebPlayCount,
  loadAdv,
  loadAdventureWebPlayCount,
  saveAdv,
  WEB_ADVENTURE_MAX_PLAYS,
  type AdvProgress,
} from '../storage/gameStorage'
import {
  MAP_HEART_MAX,
  applyMapHeartRegen,
  consumeMapHeartOnLoss,
  formatHeartCountdownMs,
  type MapHeartsState,
} from '../storage/mapHearts'
import { isWordMasterHardMode } from '../storage/wordUsage'
import {
  loadAdventureRandomSeed,
  recordAdventureSessionComplete,
  saveAdventureRandomSeed,
} from '../storage/adventurePacing'
import { useI18n } from '../context/I18nContext'
import { clearWordleSession } from '../lib/wordleSession'
import { APP_STORE_URL, PLAY_STORE_URL } from '../lib/storeLinks'
import { DocumentPipWrap } from './DocumentPipWrap'
import { WordleGame } from './WordleGame'

function contrastTextClass(rgbCss: string): string {
  const m = rgbCss.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!m) return 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]'
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  const L = 0.299 * r + 0.587 * g + 0.114 * b
  return L > 168
    ? 'text-black/90 [text-shadow:0_1px_0_rgba(255,255,255,0.4)]'
    : 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]'
}

type CoreProps = {
  baseCatalog: AdventureSpec[]
}

function firstIncompleteCatalogIndex(catalog: AdventureSpec[]): number {
  for (let i = 0; i < catalog.length; i++) {
    const m = catalog[i]!
    if (loadAdv(m.id).cleared.length < m.stageOrder.length) return i
  }
  return Math.max(0, catalog.length - 1)
}

function AdventureViewCore({ baseCatalog }: CoreProps) {
  const { t } = useI18n()
  const [progressVersion, setProgressVersion] = useState(0)
  const bumpProgress = () => setProgressVersion((v) => v + 1)

  const [campaignRev, setCampaignRev] = useState(0)
  const phase = useMemo(
    () => loadCampaignPhase(),
    [campaignRev, progressVersion],
  )
  const inRandomEndless = phase === 'random'

  const activeCatalog = useMemo(() => {
    if (inRandomEndless) return []
    return getCatalogForPhase(phase, baseCatalog)
  }, [phase, inRandomEndless, baseCatalog])

  const [catalogIdx, setCatalogIdx] = useState(() =>
    firstIncompleteCatalogIndex(getCatalogForPhase(loadCampaignPhase(), baseCatalog)),
  )
  const [randomSeed, setRandomSeed] = useState(() => loadAdventureRandomSeed())

  const hubSpec = useMemo(() => {
    if (inRandomEndless) {
      return createRandomAdventureSpec(randomSeed)
    }
    return activeCatalog[catalogIdx] ?? activeCatalog[0]!
  }, [inRandomEndless, activeCatalog, catalogIdx, randomSeed])

  const specForPlayRef = useRef(hubSpec)
  const saved = useMemo(() => loadAdv(hubSpec.id), [hubSpec.id])
  const [cleared, setCleared] = useState<number[]>(saved.cleared)
  const clearedRef = useRef(cleared)
  clearedRef.current = cleared

  const [gameStage, setGameStage] = useState<number | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    if (gameStage !== null) return
    setCleared(loadAdv(hubSpec.id).cleared)
  }, [hubSpec.id, gameStage])

  useEffect(() => {
    if (gameStage === null) specForPlayRef.current = hubSpec
  }, [hubSpec, gameStage])

  /** 어드벤처 탭(코어) 진입 시각 — 전면 광고 최소 간격(첫 광고 전) 기준 */
  const adventureSessionStartedAtRef = useRef<number>(Date.now())
  useEffect(() => {
    adventureSessionStartedAtRef.current = Date.now()
  }, [])

  const [interstitialOpen, setInterstitialOpen] = useState(false)
  const isWeb = !Capacitor.isNativePlatform()
  const [webAdvPlays, setWebAdvPlays] = useState(() =>
    loadAdventureWebPlayCount(),
  )

  const [heartRev, setHeartRev] = useState(0)
  const [heartState, setHeartState] = useState<MapHeartsState>(() =>
    applyMapHeartRegen(),
  )

  useEffect(() => {
    const run = () => setHeartState(applyMapHeartRegen())
    run()
    const id = window.setInterval(run, 1000)
    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [heartRev, progressVersion])

  useEffect(() => {
    if (inRandomEndless || activeCatalog.length === 0) return
    setCatalogIdx((i) =>
      i >= activeCatalog.length ? activeCatalog.length - 1 : i,
    )
  }, [inRandomEndless, activeCatalog])

  const wordMaster = useMemo(
    () => isWordMasterHardMode(),
    [progressVersion, campaignRev],
  )

  const total = hubSpec.stageOrder.length

  const displayCleared = cleared

  /** consecutiveWins: 이번 저장 후 값 (0이면 필드 생략) */
  const persist = (next: number[], mapId: string, consecutiveWins: number) => {
    setCleared(next)
    const pack: AdvProgress = { mapId, cleared: next }
    if (consecutiveWins > 0) pack.consecutiveWins = consecutiveWins
    saveAdv(pack)
    bumpProgress()
  }

  const startStage = (idx: number) => {
    specForPlayRef.current = hubSpec
    const { word } = getAdventureAnswer(hubSpec, idx)
    setGameStage(idx)
    setAnswer(word)
    setGameKey((k) => k + 1)
  }

  const beginPlay = () => {
    if (nextIdx < 0) return
    startStage(nextIdx)
  }

  const onWin = () => {
    if (gameStage === null) return
    if (isWeb) {
      setWebAdvPlays(incrementAdventureWebPlayCount())
    }
    const playSpec = specForPlayRef.current
    console.log('[Interstitial Ad] Stage cleared')
    const st = gameStage
    const totalStages = playSpec.stageOrder.length
    const disk = loadAdv(playSpec.id)
    let next = cleared.includes(st)
      ? [...cleared]
      : [...cleared, st].sort((a, b) => a - b)

    let cw = (disk.consecutiveWins ?? 0) + 1
    if (cw >= 2) {
      const bonus = Array.from({ length: totalStages }, (_, i) => i).find(
        (i) => !next.includes(i),
      )
      if (bonus !== undefined) {
        next = [...next, bonus].sort((a, b) => a - b)
      }
      cw = 0
    }

    persist(next, playSpec.id, cw)

    const advanced = tryAdvanceCampaignPhase(baseCatalog)
    if (advanced !== null) {
      setCampaignRev((v) => v + 1)
    }

    const isRandomFull =
      playSpec.id.startsWith('random-') &&
      next.length >= playSpec.stageOrder.length
    if (isRandomFull) {
      const ns = randomSeed + 1
      saveAdventureRandomSeed(ns)
      setRandomSeed(ns)
    }

    window.setTimeout(() => {
      clearWordleSession(
        `adv-${playSpec.id}-s${st}-${answer.toLowerCase()}`,
      )
      setGameStage(null)
      const { showInterstitial } = recordAdventureSessionComplete({
        now: Date.now(),
        sessionStartedAt: adventureSessionStartedAtRef.current,
      })
      if (showInterstitial) {
        setInterstitialOpen(true)
        window.setTimeout(() => setInterstitialOpen(false), 2200)
      }
    }, 1800)
  }

  const returnToHubFromSessionEnd = (
    source?: 'default' | 'session_end',
  ) => {
    if (gameStage !== null && answer) {
      const spec = specForPlayRef.current
      clearWordleSession(
        `adv-${spec.id}-s${gameStage}-${answer.toLowerCase()}`,
      )
    }
    setGameStage(null)
    if (source !== 'session_end') return
    const { showInterstitial } = recordAdventureSessionComplete({
      now: Date.now(),
      sessionStartedAt: adventureSessionStartedAtRef.current,
    })
    if (showInterstitial) {
      setInterstitialOpen(true)
      window.setTimeout(() => setInterstitialOpen(false), 2200)
    }
  }

  const onStageLose = useCallback(() => {
    if (gameStage === null) return
    if (isWeb) {
      setWebAdvPlays(incrementAdventureWebPlayCount())
    }
    const playSpec = specForPlayRef.current
    persist(clearedRef.current, playSpec.id, 0)
    consumeMapHeartOnLoss()
    setHeartRev((v) => v + 1)
  }, [gameStage, isWeb])

  const onLoseRetry = (): boolean => {
    if (gameStage === null) return false
    const L = answer.length as 4 | 5 | 6
    setAnswer((prev) => pickAdventureRetryWord(L, prev))
    setGameKey((k) => k + 1)
    return true
  }

  const wordLen =
    gameStage !== null && answer
      ? (answer.length === 4 || answer.length === 5 || answer.length === 6
          ? (answer.length as 4 | 5 | 6)
          : 5)
      : (5 as const)

  const nextIdx =
    Array.from({ length: total }, (_, i) => i).find(
      (i) => !displayCleared.includes(i),
    ) ?? -1

  const canPlay = nextIdx >= 0
  const noHearts = heartState.hearts <= 0
  const webAdvLimitReached =
    isWeb && webAdvPlays >= WEB_ADVENTURE_MAX_PLAYS

  const playDisabled = !canPlay || noHearts || webAdvLimitReached

  const consecutiveWinsForBonus = useMemo(() => {
    return loadAdv(hubSpec.id).consecutiveWins ?? 0
  }, [hubSpec.id, progressVersion])

  /** 매니페스트 맨 마지막 맵(보통 별빛밤)까지 클리어 — 랜덤 모드는 별도 문구 사용 */
  const showMoreMapsLaterHint = useMemo(() => {
    const last = baseCatalog[baseCatalog.length - 1]
    if (!last) return false
    const p = loadAdv(last.id)
    return p.cleared.length >= last.stageOrder.length
  }, [baseCatalog, progressVersion])

  const catalogLen = activeCatalog.length
  const canMapNav = !inRandomEndless && catalogLen > 1
  const mapOrdinal = canMapNav ? catalogIdx + 1 : 0

  const goPrevMap = () => {
    if (!canMapNav) return
    setCatalogIdx((i) => (i - 1 + catalogLen) % catalogLen)
  }
  const goNextMap = () => {
    if (!canMapNav) return
    setCatalogIdx((i) => (i + 1) % catalogLen)
  }

  if (gameStage !== null && answer) {
    const playSpec = specForPlayRef.current
    return (
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="glass-panel p-4">
          <DocumentPipWrap>
            <WordleGame
              key={`${gameStage}-${gameKey}-${answer}`}
              answer={answer}
              wordLength={wordLen}
              gameKey={`${gameStage}-${gameKey}-${answer}`}
              onWin={onWin}
              onLose={onStageLose}
              onRetry={onLoseRetry}
              allowAd
              onHome={returnToHubFromSessionEnd}
              toolbarSubtitle={`${t('mapToolbar', { n: gameStage + 1, len: wordLen })}${wordMaster ? t('wordMasterSuffix') : ''}`}
              persistKey={`adv-${playSpec.id}-s${gameStage}-${answer.toLowerCase()}`}
            />
          </DocumentPipWrap>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {webAdvLimitReached && (
        <div className="rounded-[12px] border border-sky-400/55 bg-sky-50 px-4 py-4 text-[13px] leading-snug text-sky-950 shadow-sm dark:border-sky-500/40 dark:bg-sky-950/35 dark:text-sky-100">
          <p className="text-[15px] font-bold text-sky-900 dark:text-sky-50">
            {t('webAdvLimitTitle')}
          </p>
          <p className="mt-2 text-[13px] text-sky-900/90 dark:text-sky-100/90">
            {t('webAdvLimitBody')}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center rounded-[12px] bg-[#007AFF] py-3 text-center text-[15px] font-semibold text-white active:bg-[#0066D6] dark:bg-[#0A84FF]"
            >
              {t('webAdvPlayStore')}
            </a>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center rounded-[12px] border border-sky-600/40 bg-white/90 py-3 text-center text-[15px] font-semibold text-sky-900 active:opacity-90 dark:border-sky-400/35 dark:bg-white/10 dark:text-white"
            >
              {t('webAdvAppStore')}
            </a>
          </div>
        </div>
      )}

      {wordMaster && (
        <div className="flex items-center gap-2 rounded-[10px] border border-amber-400/40 bg-amber-50 px-3 py-2 dark:border-amber-500/40 dark:bg-amber-950/40">
          <Award className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-[14px] font-semibold text-amber-900 dark:text-amber-100">
              {t('wordMasterTitle')}
            </p>
            <p className="text-[12px] text-amber-800/90 dark:text-amber-200/90">
              {t('wordMasterDesc')}
            </p>
          </div>
        </div>
      )}

      {inRandomEndless && (
        <p className="px-0.5 text-center text-[13px] text-[#8E8E93]">
          {t('randomEndless')}
        </p>
      )}

      <div className="flex flex-col items-center gap-1 px-0.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div
            className="flex items-center gap-0.5"
            aria-label={t('mapHeartsAria')}
          >
            {Array.from({ length: MAP_HEART_MAX }, (_, i) => (
              <Heart
                key={i}
                className={`h-6 w-6 ${
                  i < heartState.hearts
                    ? 'fill-rose-500 text-rose-500'
                    : 'fill-none text-[#C7C7CC] dark:text-[#48484A]'
                }`}
                strokeWidth={1.85}
                aria-hidden
              />
            ))}
          </div>
          {heartState.hearts < MAP_HEART_MAX &&
            heartState.nextHeartAtMs != null && (
              <span
                className="text-[12px] font-medium tabular-nums text-[#8E8E93]"
                aria-label={t('mapHeartsNext', {
                  time: formatHeartCountdownMs(
                    heartState.nextHeartAtMs - Date.now(),
                  ),
                })}
              >
                {formatHeartCountdownMs(
                  heartState.nextHeartAtMs - Date.now(),
                )}
              </span>
            )}
        </div>
        <p className="text-center text-[10px] leading-snug text-[#8E8E93]">
          {t('mapHeartsRule')}
        </p>
      </div>

      <div className="flex items-center justify-between px-0.5">
        <span className="text-[16px] font-semibold tabular-nums text-[#000000] dark:text-white">
          {t('progress')} {displayCleared.length}/{total}
        </span>
        {canMapNav && (
          <span className="text-[12px] text-[#8E8E93]">
            {t('mapOrdinal')} {mapOrdinal}/{catalogLen}
          </span>
        )}
      </div>

      <div className="glass-panel p-3">
        <div
          className={
            hubSpec.displayInvert
              ? '[filter:invert(1)] dark:[filter:invert(1)_hue-rotate(180deg)]'
              : ''
          }
        >
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${hubSpec.cols}, minmax(0, 1fr))`,
            }}
          >
          {hubSpec.mask.flatMap((row, r) =>
            row.map((cell, c) => {
              const si = hubSpec.stageOrder.findIndex(
                (p) => p.row === r && p.col === c,
              )
              if (cell === 0) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="aspect-square min-w-[14px] opacity-0 sm:min-w-[18px]"
                  />
                )
              }
              const done = displayCleared.includes(si)
              const isCurrent = nextIdx >= 0 && si === nextIdx
              const locked = !done && !isCurrent
              const dotColor = hubSpec.cellColors[r]?.[c] ?? ''
              const filledBg =
                done && dotColor ? { backgroundColor: dotColor } : undefined
              return (
                <div
                  key={`${r}-${c}`}
                  role="img"
                  aria-label={
                    done
                      ? t('stageAriaCleared', { n: si + 1 })
                      : isCurrent
                        ? t('stageAriaCurrent', { n: si + 1 })
                        : t('stageAriaLocked', { n: si + 1 })
                  }
                  title={
                    locked
                      ? t('tileTitleLocked')
                      : isCurrent
                        ? t('tileTitleCurrent')
                        : t('tileTitleDone', { n: si + 1 })
                  }
                  style={filledBg}
                  className={`flex aspect-square min-w-[14px] items-center justify-center rounded-[6px] text-[9px] font-semibold sm:min-w-[18px] sm:text-[10px] ${
                    isCurrent
                      ? 'bg-[#007AFF] text-white ring-2 ring-[#007AFF] ring-offset-2 ring-offset-white dark:bg-[#0A84FF] dark:ring-[#0A84FF] dark:ring-offset-[#1C1C1E]'
                      : done
                        ? dotColor
                          ? contrastTextClass(dotColor)
                          : 'bg-[#34C759] text-white dark:bg-[#30D158]'
                        : 'bg-[#E5E5EA]/70 text-[#AEAEB2] dark:bg-[#2C2C2E]/60 dark:text-[#636366]'
                  }`}
                >
                  {si + 1}
                </div>
              )
            }),
          )}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={playDisabled}
        title={
          webAdvLimitReached
            ? t('webAdvLimitTitle')
            : noHearts
              ? t('mapNoHeartsPlay')
              : undefined
        }
        onClick={beginPlay}
        className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#007AFF] py-3.5 text-[17px] font-semibold text-white active:bg-[#0066D6] disabled:cursor-not-allowed disabled:bg-[#E5E5EA] disabled:text-[#C7C7CC] dark:bg-[#0A84FF] dark:active:bg-[#0076E4] dark:disabled:bg-[#2C2C2E] dark:disabled:text-[#48484A]"
      >
        <Play className="h-[22px] w-[22px] fill-current" aria-hidden />
        {nextIdx >= 0 ? t('playStage', { n: nextIdx + 1 }) : t('play')}
      </button>

      <div className="space-y-1.5 px-0.5 pb-1 pt-1 text-center text-[11px] leading-snug text-[#8E8E93]">
        <p>{t('adventureWinBonusRule')}</p>
        <p>{t('adventureWinBonusLoseReset')}</p>
        {consecutiveWinsForBonus === 1 && nextIdx >= 0 && (
          <p className="font-medium text-emerald-700/90 dark:text-emerald-300/90">
            {t('adventureWinBonusNext')}
          </p>
        )}
        {showMoreMapsLaterHint && (
          <p className="text-[10px] leading-snug text-[#8E8E93]/95 dark:text-[#8E8E93]/85">
            {t('adventureMoreMapsLater')}
          </p>
        )}
      </div>

      {canMapNav && (
        <div className="flex items-center justify-center gap-3 pb-1 pt-2">
          <button
            type="button"
            onClick={goPrevMap}
            className="flex h-9 items-center gap-1 rounded-full border border-white/45 bg-white/35 px-3 text-[13px] font-semibold text-[#007AFF] shadow-sm backdrop-blur-md active:scale-[0.98] dark:border-white/15 dark:bg-white/10 dark:text-sky-300"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t('prev')}
          </button>
          <button
            type="button"
            onClick={goNextMap}
            className="flex h-9 items-center gap-1 rounded-full border border-white/45 bg-white/35 px-3 text-[13px] font-semibold text-[#007AFF] shadow-sm backdrop-blur-md active:scale-[0.98] dark:border-white/15 dark:bg-white/10 dark:text-sky-300"
          >
            {t('next')}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {interstitialOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm dark:bg-black/65"
          role="dialog"
          aria-modal="true"
          aria-labelledby="interstitial-ad-title"
        >
          <div className="w-full max-w-[280px] rounded-[22px] border border-white/25 bg-white/15 px-6 py-8 text-center shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-black/35">
            <Loader2
              className="mx-auto h-9 w-9 animate-spin text-[#007AFF] dark:text-sky-400"
              aria-hidden
            />
            <p
              id="interstitial-ad-title"
              className="mt-4 text-[16px] font-semibold text-[#0f172a] dark:text-white"
            >
              {t('interstitialLoading')}
            </p>
            <p className="mt-2 text-[12px] leading-snug text-[#64748b] dark:text-sky-200/80">
              {t('interstitialWait')}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

export function AdventureView() {
  const { t } = useI18n()
  const [pixelCatalog, setPixelCatalog] = useState<AdventureSpec[] | null>(null)

  useEffect(() => {
    let cancelled = false
    loadPixelAdventureCatalog().then((specs) => {
      if (!cancelled) setPixelCatalog(specs)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (pixelCatalog === null) {
    return (
      <div className="glass-panel flex w-full max-w-lg flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <p className="text-[17px] font-medium text-[#000000] dark:text-white">
          {t('loadingBitmap')}
        </p>
        <p className="text-[13px] text-[#8E8E93]">{t('bitmapManifest')}</p>
      </div>
    )
  }

  if (pixelCatalog.length === 0) {
    return (
      <div className="glass-panel flex w-full max-w-lg flex-col gap-3 px-5 py-6">
        <p className="text-[17px] font-semibold text-[#000000] dark:text-white">
          {t('bitmapEmptyTitle')}
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-[14px] text-[#3C3C43] dark:text-[#EBEBF5]">
          <li>{t('bitmapStep1')}</li>
          <li>{t('bitmapStep2')}</li>
        </ol>
        <pre className="overflow-x-auto rounded-[8px] bg-[#F2F2F7] p-3 text-left text-[12px] leading-relaxed text-[#000000] dark:bg-[#2C2C2E] dark:text-[#EBEBF5]">
{`[
  { "id": "hero", "name": "히어로", "file": "hero.png" },
  { "id": "cat", "name": "고양이", "file": "cat.png" }
]`}
        </pre>
        <p className="text-[13px] text-[#8E8E93]">{t('bitmapEmptyFoot')}</p>
      </div>
    )
  }

  return <AdventureViewCore baseCatalog={pixelCatalog} />
}
