import type { StudyHistory } from '../types'
import { toDateKey } from './history'

export interface DayCell {
  /** YYYY-MM-DD */
  dateKey: string
  /** 日（1-31） */
  day: number
  /** その日にクリアしたステージ数 */
  count: number
}

/**
 * 1 か月ぶんのカレンダーのマスを返す。
 * 週の頭（日曜）に合わせるため、月初の曜日ぶんだけ先頭に null を詰める。
 * month は Date に合わせて 0 始まり。
 */
export function buildMonthGrid(
  year: number,
  month: number,
  history: StudyHistory,
): (DayCell | null)[] {
  const firstDay = new Date(year, month, 1)
  // 翌月の 0 日目 = 今月の末日
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const grid: (DayCell | null)[] = Array.from(
    { length: firstDay.getDay() },
    () => null,
  )
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(new Date(year, month, day))
    grid.push({ dateKey, day, count: history[dateKey] ?? 0 })
  }
  return grid
}

/** マスを 7 日ずつの週に切り分ける。最後の週は null で埋めて 7 個そろえる */
export function chunkIntoWeeks(grid: (DayCell | null)[]): (DayCell | null)[][] {
  const weeks: (DayCell | null)[][] = []
  for (let i = 0; i < grid.length; i += 7) {
    const week = grid.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

/** ヒートマップの濃さ。0 はグレー、1〜4 は緑が濃くなっていく */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}
