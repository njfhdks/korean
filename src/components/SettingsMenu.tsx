import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { Settings, X } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { showAdPrivacyOptionsForm } from '../lib/adMobConsent'
import { loadSfxVolume, saveSfxVolume } from '../storage/gameStorage'

export function SettingsMenu() {
  const { t } = useI18n()
  const dialogId = useId()
  const titleId = `${dialogId}-title`
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const native = Capacitor.isNativePlatform()
  const [sfxPct, setSfxPct] = useState(() =>
    Math.round(loadSfxVolume() * 100),
  )

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (open) setSfxPct(Math.round(loadSfxVolume() * 100))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open) panelRef.current?.querySelector('a')?.focus()
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-btn-icon"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={t('settings')}
      >
        <Settings className="h-[22px] w-[22px]" strokeWidth={2.2} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-4 pb-[max(7rem,env(safe-area-inset-bottom)+5.5rem)] pt-8 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) close()
            }}
          >
            <div
              ref={panelRef}
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="glass-panel w-full max-w-sm max-h-[min(85dvh,32rem)] overflow-y-auto p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/30 pb-3 dark:border-white/10">
                <h2
                  id={titleId}
                  className="text-[17px] font-bold text-[#000000] dark:text-white"
                >
                  {t('settings')}
                </h2>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg p-2 text-[#007AFF] dark:text-[#0A84FF]"
                  aria-label={t('settingsClose')}
                >
                  <X className="h-5 w-5" strokeWidth={2.2} />
                </button>
              </div>
              <div className="mt-4 space-y-2 border-b border-white/20 pb-4 dark:border-white/10">
                <label
                  htmlFor={`${dialogId}-sfx`}
                  className="block text-[13px] font-medium text-[#3C3C43] dark:text-[#EBEBF5]"
                >
                  {t('settingsSfxVolume')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id={`${dialogId}-sfx`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sfxPct}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      setSfxPct(n)
                      saveSfxVolume(n / 100)
                    }}
                    className="h-2 min-w-0 flex-1 cursor-pointer accent-[#007AFF] dark:accent-[#0A84FF]"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={sfxPct}
                    aria-valuetext={
                      sfxPct === 0 ? t('settingsSfxMute') : `${sfxPct}%`
                    }
                  />
                  <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-[#8E8E93]">
                    {sfxPct === 0 ? t('settingsSfxMute') : `${sfxPct}%`}
                  </span>
                </div>
              </div>
              <nav className="mt-3 flex flex-col gap-2">
                {native && (
                  <Link
                    to="/privacy"
                    onClick={close}
                    className="rounded-[12px] border border-white/40 bg-white/30 px-4 py-3.5 text-center text-[16px] font-semibold text-[#007AFF] backdrop-blur-md active:opacity-90 dark:border-white/15 dark:bg-white/10 dark:text-[#0A84FF]"
                  >
                    {t('settingsPrivacy')}
                  </Link>
                )}
                {native && (
                  <button
                    type="button"
                    onClick={() => {
                      void showAdPrivacyOptionsForm()
                      close()
                    }}
                    className="rounded-[12px] border border-white/40 bg-white/20 px-4 py-3.5 text-center text-[15px] font-semibold text-[#3C3C43] backdrop-blur-md active:opacity-90 dark:border-white/15 dark:bg-white/5 dark:text-[#EBEBF5]"
                  >
                    {t('settingsAdChoices')}
                  </button>
                )}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
