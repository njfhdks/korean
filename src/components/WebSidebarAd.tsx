import { Capacitor } from '@capacitor/core'
import { WebAdSenseUnit } from './WebAdSenseUnit'

/**
 * 넓은 화면에서만 우측 고정 보조 광고. `VITE_ADSENSE_SLOT_SIDEBAR` 없으면 렌더 안 함.
 */
export function WebSidebarAd() {
  if (Capacitor.isNativePlatform()) return null

  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined
  const slot = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined
  if (!client || !slot) return null

  return (
    <aside
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden w-[300px] -translate-y-1/2 xl:block"
      aria-hidden
    >
      <div className="pointer-events-auto rounded-2xl border border-white/30 bg-white/20 p-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/30">
        <WebAdSenseUnit
          client={client}
          slot={slot}
          format="vertical"
          className="min-h-[250px] w-full"
        />
      </div>
    </aside>
  )
}
