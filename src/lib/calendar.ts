import type { StudyHistory } from '../types'
import { toDateKey } from './history'

/** Date#getDay() の値でそのまま引ける曜日ラベル */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

/** マスの読み上げ・ホバー用ラベル。month は 0 始まり */
export function formatDayLabel(
  month: number,
  day: number,
  count: number,
): string {
  return `${month + 1}月${day}日 ${count > 0 ? `${count}ステージ` : '記録なし'}`
}

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

export interface RecentDay extends DayCell {
  /** 月。buildMonthGrid の引数に合わせて 0 始まり */
  month: number
  /** 曜日（0=日 … 6=土） */
  weekday: number
}

/**
 * 今日を右端にした直近 days 日分のマスを、古い順に返す。
 *
 * 日付は必ずローカルの年月日から組み立てる。JS が月末・年末をまたいで正規化してくれるうえ、
 * `today.getTime() - back * 86400000` のようなミリ秒引き算と違って夏時間で 1 日ずれない
 * （toDateKey が toISOString を避けているのと同じ理由）。
 */
export function buildRecentDays(
  today: Date,
  days: number,
  history: StudyHistory,
): RecentDay[] {
  const cells: RecentDay[] = []
  for (let back = days - 1; back >= 0; back--) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - back,
    )
    const dateKey = toDateKey(date)
    cells.push({
      dateKey,
      month: date.getMonth(),
      day: date.getDate(),
      weekday: date.getDay(),
      count: history[dateKey] ?? 0,
    })
  }
  return cells
}

/** ヒートマップの濃さ。0 はグレー、1〜4 は緑が濃くなっていく */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  return 4
}
