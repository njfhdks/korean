/** 월 달력 한 칸 (월 밖 패딩은 date null) */
export interface MonthCalendarCell {
  date: Date | null
  /** 해당 월에 속하는 날이면 true */
  inMonth: boolean
}

/**
 * 월요일 시작 7열 그리드. 앞뒤 빈 칸은 date: null.
 */
export function buildMonthCalendarGrid(
  year: number,
  month: number,
): MonthCalendarCell[] {
  const first = new Date(year, month, 1)
  first.setHours(12, 0, 0, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = first.getDay()
  const pad = (startDow + 6) % 7

  const cells: MonthCalendarCell[] = []

  for (let i = 0; i < pad; i++) {
    cells.push({ date: null, inMonth: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    date.setHours(12, 0, 0, 0)
    cells.push({ date, inMonth: true })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, inMonth: false })
  }

  return cells
}
