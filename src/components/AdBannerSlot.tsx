import { Capacitor } from '@capacitor/core'
import { useI18n } from '../context/I18nContext'
import { WebAdSenseUnit } from './WebAdSenseUnit'

export function AdBannerSlot() {
  const { t } = useI18n()
  const isNative = Capacitor.isNativePlatform()
  const client = import.meta.env.VITE_ADSENSE_CLIENT
  const slot = import.meta.env.VITE_ADSENSE_SLOT
  const showWebAd =
    !isNative && typeof client === 'string' && client && typeof slot === 'string' && slot

  if (showWebAd) {
    return (
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-white/20 bg-white/25 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl dark:border-white/10 dark:bg-black/35">
        <div
          className="pointer-events-auto w-full max-w-[min(100%,728px)] px-2"
          role="complementary"
          aria-label={t('adSlotAria')}
        >
          <WebAdSenseUnit
            client={client}
            slot={slot}
            format="horizontal"
            className="mx-auto min-h-[50px] max-h-[90px]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-white/20 bg-white/25 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl dark:border-white/10 dark:bg-black/35">
      <div
        className="pointer-events-auto flex aspect-[320/50] w-full max-w-[320px] min-h-[44px] max-h-[56px] items-center justify-center rounded-xl border border-white/40 bg-white/30 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        role="complementary"
        aria-label={t('adSlotAria')}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400/70">
          {t('adLabel')}
        </span>
      </div>
    </div>
  )
}
