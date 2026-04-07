import { useEffect, useMemo, useState } from 'react'
import { Calendar, Map, Play } from 'lucide-react'
import { useI18n } from './context/I18nContext'
import { getOrCreateDailyAnswer } from './lib/dailyWord'
import { loadWordleSession } from './lib/wordleSession'
import {
  recordDailyWin,
  loadStreak,
  hasLockedDailyToday,
  lockDailyForToday,
  resetDailyStreakOnFail,
} from './storage/gameStorage'
import { ContributionGraph } from './components/ContributionGraph'
import { WordleGame } from './components/WordleGame'
import { AdventureView } from './components/AdventureView'
import { DocumentPipWrap } from './components/DocumentPipWrap'
import { ThemeToggle } from './components/ThemeToggle'
import { SettingsMenu } from './components/SettingsMenu'
import { initAdMobConsentOnce } from './lib/adMobConsent'

function dailyWordLength(d: Date): 4 | 5 | 6 {
  const n = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()
  return ((n % 3) + 4) as 4 | 5 | 6
}

export default function App() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'daily' | 'map'>('daily')
  const [dailyScreen, setDailyScreen] = useState<'hub' | 'play'>('hub')
  const [graphV, setGraphV] = useState(0)
  const [dailyLockV, setDailyLockV] = useState(0)

  const len = useMemo(() => dailyWordLength(new Date()), [])

  const dailyAnswer = useMemo(() => getOrCreateDailyAnswer(len), [len])

  const persistDaily = `daily-${len}-${dailyAnswer.toLowerCase()}`

  const inProgressDaily = useMemo(() => {
    const s = loadWordleSession(
      persistDaily,
      dailyAnswer.toLowerCase(),
      len,
    )
    return (
      s != null && (s.status === 'playing' || s.status === 'offer_ad')
    )
  }, [len, dailyAnswer, persistDaily, dailyScreen, dailyLockV])

  const dailyDoneForToday = useMemo(() => {
    return hasLockedDailyToday() && !inProgressDaily
  }, [inProgressDaily, dailyScreen, dailyLockV])

  const canStartDaily = !dailyDoneForToday

  const streak = useMemo(() => loadStreak(), [graphV])

  const tabBtn = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-semibold tracking-tight transition ${
      active ? 'glass-tab-active' : 'glass-tab-idle'
    }`

  const goDaily = () => {
    setMode('daily')
  }

  const goWordMap = () => {
    setMode('map')
    setDailyScreen('hub')
  }

  useEffect(() => {
    void initAdMobConsentOnce()
  }, [])

  return (
    <>
    <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-end gap-1 pt-1">
        <SettingsMenu />
        <ThemeToggle />
      </header>

      <nav className="glass-nav">
        <button
          type="button"
          onClick={goDaily}
          className={tabBtn(mode === 'daily')}
        >
          <Calendar className="h-[15px] w-[15px] opacity-90" strokeWidth={2.2} />
          {t('tabDaily')}
        </button>
        <button
          type="button"
          onClick={goWordMap}
          className={tabBtn(mode === 'map')}
        >
          <Map className="h-[15px] w-[15px] opacity-90" strokeWidth={2.2} />
          {t('tabWordMap')}
        </button>
      </nav>

      {mode === 'daily' && (
        <DocumentPipWrap>
          <div className="flex w-full flex-col gap-5">
            {dailyScreen === 'hub' && (
              <>
                <section className="glass-panel flex justify-center gap-12 px-6 py-5 text-center">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
                      {t('streak')}
                    </p>
                    <p className="mt-0.5 text-[34px] font-bold tabular-nums leading-none text-[#007AFF] dark:text-[#0A84FF]">
                      {streak.current}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#8E8E93]">
                      {t('best')}
                    </p>
                    <p className="mt-0.5 text-[34px] font-bold tabular-nums leading-none text-[#000000] dark:text-white">
                      {streak.max}
                    </p>
                  </div>
                </section>

                <ContributionGraph version={graphV} />

                <section className="glass-panel">
                  <div className="border-b border-white/35 px-4 py-3 text-center dark:border-white/[0.1]">
                    <p className="text-[13px] text-[#8E8E93]">
                      {t('dailyLengthBefore')}
                      <span className="font-semibold text-[#000000] dark:text-white">
                        {len}
                      </span>
                      {t('dailyLengthAfter')}
                    </p>
                  </div>
                  <div className="p-4">
                    {!canStartDaily && (
                      <p className="mb-3 text-center text-[13px] leading-snug text-[#8E8E93]">
                        {t('dailyDoneToday')}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!canStartDaily}
                      onClick={() => {
                        if (!hasLockedDailyToday()) lockDailyForToday()
                        setDailyLockV((v) => v + 1)
                        setDailyScreen('play')
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#007AFF] py-3.5 text-[17px] font-semibold text-white active:bg-[#0066D6] disabled:cursor-not-allowed disabled:bg-[#E5E5EA] disabled:text-[#C7C7CC] dark:bg-[#0A84FF] dark:active:bg-[#0076E4] dark:disabled:bg-[#2C2C2E] dark:disabled:text-[#48484A]"
                    >
                      <Play className="h-[22px] w-[22px] fill-current" aria-hidden />
                      {inProgressDaily ? t('continue') : t('play')}
                    </button>
                  </div>
                </section>
              </>
            )}

            {dailyScreen === 'play' && dailyAnswer && (
              <section className="glass-panel p-4">
                <WordleGame
                  key={persistDaily}
                  answer={dailyAnswer}
                  wordLength={len}
                  gameKey={persistDaily}
                  onWin={() => {
                    recordDailyWin()
                    setGraphV((v) => v + 1)
                  }}
                  onLose={() => {
                    resetDailyStreakOnFail()
                    setGraphV((v) => v + 1)
                  }}
                  allowAd
                  onHome={() => {
                    setDailyLockV((v) => v + 1)
                    setDailyScreen('hub')
                  }}
                  toolbarSubtitle={t('dailyToolbar', { len: String(len) })}
                  persistKey={persistDaily}
                  omitLoseHint
                />
              </section>
            )}
          </div>
        </DocumentPipWrap>
      )}

      {mode === 'map' && <AdventureView />}
    </div>
    </>
  )
}
