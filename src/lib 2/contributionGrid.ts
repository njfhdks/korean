/** GitHub 스타일 52주×7일 잔디: 열=주, 행=요일(0=일 … 6=토) */

export interface GrassCell {
  date: Date
  weekCol: number
  dayRow: number
}

export interface YearGridResult {
  cells: GrassCell[]
  weekCount: number
  startSunday: Date
  endDate: Date
}

/** 오늘 기준 과거 1년 구간, 주 시작은 일요일 */
export function buildYearContributionGrid(today: Date = new Date()): YearGridResult {
  const endDate = new Date(today)
  endDate.setHours(12, 0, 0, 0)

  const start = new Date(endDate)
  start.setDate(start.getDate() - 364)

  const startSunday = new Date(start)
  const dow = startSunday.getDay()
  startSunday.setDate(startSunday.getDate() - dow)
  startSunday.setHours(12, 0, 0, 0)

  const cells: GrassCell[] = []
  const cur = new Date(startSunday)

  while (cur <= endDate) {
    const msPerDay = 24 * 60 * 60 * 1000
    const daysFromAnchor = Math.floor(
      (cur.getTime() - startSunday.getTime()) / msPerDay,
    )
    const weekCol = Math.floor(daysFromAnchor / 7)
    const dayRow = cur.getDay()

    cells.push({
      date: new Date(cur),
      weekCol,
      dayRow,
    })
    cur.setDate(cur.getDate() + 1)
  }

  const weekCount = Math.max(...cells.map((c) => c.weekCol), 0) + 1

  return { cells, weekCount, startSunday, endDate }
}
