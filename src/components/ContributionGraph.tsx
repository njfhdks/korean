import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { buildMonthCalendarGrid } from '../lib/contributionGrid'
import { loadJson, keys, localIsoDate } from '../storage/gameStorage'

type Props = { version: number }

/** 2024-01-01 = 월요일 — 그리드 열 순서와 맞춤 */
const REF_MONDAY = new Date(2024, 0, 1)

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function ContributionGraph({ version }: Props) {
  const { locale, t } = useI18n()
  const localeTag = locale === 'ko' ? 'ko-KR' : 'en-US'

  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(localeTag, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(REF_MONDAY)
      d.setDate(d.getDate() + i)
      return fmt.format(d)
    })
  }, [localeTag])

  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  const now = new Date()

  const cells = useMemo(
    () => buildMonthCalendarGrid(cursor.y, cursor.m),
    [cursor.y, cursor.m],
  )

  const contrib = useMemo(
    () => loadJson<Record<string, boolean>>(keys.contributions, {}),
    [version],
  )

  const canGoPrev = cursor.y > 2000 || (cursor.y === 2000 && cursor.m > 0)

  const canGoNext =
    cursor.y < now.getFullYear() ||
    (cursor.y === now.getFullYear() && cursor.m < now.getMonth())

  const goPrev = () => {
    setCursor((c) =>
      c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
    )
  }

  const goNext = () => {
    if (!canGoNext) return
    setCursor((c) =>
      c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
    )
  }

  const title = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        year: 'numeric',
        month: 'long',
      }).format(new Date(cursor.y, cursor.m, 1)),
    [cursor.y, cursor.m, localeTag],
  )

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between border-b border-white/35 px-2 py-2 dark:border-white/[0.1]">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="rounded-lg p-2 text-[#007AFF] active:opacity-50 disabled:opacity-25 dark:text-[#0A84FF]"
          aria-label={t('ariaPrevMonth')}
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        <p className="text-[17px] font-semibold text-[#000000] dark:text-white">
          {title}
        </p>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          className="rounded-lg p-2 text-[#007AFF] active:opacity-50 disabled:opacity-25 dark:text-[#0A84FF]"
          aria-label={t('ariaNextMonth')}
        >
          <ChevronRight className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2.5 px-3 pb-4 pt-2 sm:gap-3 sm:px-4">
        {weekdays.map((w) => (
          <div
            key={w}
            className="pb-2 text-center text-[10px] font-semibold text-[#6b7280] dark:text-white/45 sm:text-[11px]"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) {
            return (
              <div
                key={`pad-${i}`}
                className="aspect-square w-full min-w-0 rounded-xl bg-transparent"
              />
            )
          }

          const d = cell.date
          const key = localIsoDate(d)
          const solved = !!contrib[key]
          const today = isSameDay(d, now)
          const isFuture = startOfDay(d) > startOfDay(now)

          return (
            <div
              key={key}
              className={`flex aspect-square w-full min-w-0 items-center justify-center rounded-xl text-[12px] font-semibold tabular-nums sm:text-[13px] ${
                isFuture
                  ? 'bg-white/15 text-[#a1a1aa] dark:bg-white/5 dark:text-white/25'
                  : solved
                    ? 'bg-[#D4F2E0] text-[#14532d] shadow-sm shadow-emerald-900/6 dark:bg-[#5a8574] dark:text-[#e8faf1] dark:shadow-none'
                    : 'border border-white/40 bg-white/35 text-[#57534e] backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-white/60'
              } ${today ? 'ring-2 ring-[#007AFF] ring-offset-2 ring-offset-transparent dark:ring-[#0A84FF]' : ''}`}
            >
              {d.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
