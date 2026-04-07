import { useMemo } from 'react'
import { buildYearContributionGrid } from '../lib/contributionGrid'
import { loadContributions, toISODate } from '../storage/gameStorage'

type Props = {
  className?: string
}

export function ContributionGraph({ className = '' }: Props) {
  const { cells, weekCount } = useMemo(
    () => buildYearContributionGrid(new Date()),
    [],
  )
  const contrib = useMemo(() => loadContributions(), [])

  const byDate = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const c of cells) {
      m.set(toISODate(c.date), !!contrib[toISODate(c.date)])
    }
    return m
  }, [cells, contrib])

  const grid = useMemo(() => {
    const rows: boolean[][] = Array.from({ length: 7 }, () =>
      Array(weekCount).fill(false),
    )
    for (const c of cells) {
      if (c.weekCol < weekCount) {
        rows[c.dayRow]![c.weekCol] = byDate.get(toISODate(c.date)) ?? false
      }
    }
    return rows
  }, [cells, weekCount, byDate])

  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60 p-3 shadow-inner ring-1 ring-sky-500/10 ${className}`}
    >
      <div className="flex gap-[3px]" style={{ minWidth: weekCount * 11 }}>
        {Array.from({ length: weekCount }, (_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, d) => {
              const filled = grid[d]?.[w]
              return (
                <div
                  key={`${w}-${d}`}
                  title={filled ? '클리어' : ''}
                  className={`h-2.5 w-2.5 rounded-sm sm:h-3 sm:w-3 ${
                    filled
                      ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                      : 'bg-slate-800'
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-left text-[10px] text-slate-500">
        최근 1년 · 데일리 클리어 시 칸이 채워집니다
      </p>
    </div>
  )
}
