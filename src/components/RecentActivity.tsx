import type { StudyHistory as StudyHistoryData } from '../types'
import {
  buildRecentDays,
  formatDayLabel,
  heatLevel,
  WEEKDAY_LABELS,
} from '../lib/calendar'

const DAYS = 7

interface RecentActivityProps {
  history: StudyHistoryData
  /** テストから固定日を注入できるようにしている */
  today?: Date
}

/**
 * トップに出す直近 7 日間のヒートマップ。今日が右端のローリング表示。
 * 見せるだけの帯なので、キーボード操作を伴う grid ではなく table の role を使う。
 */
export function RecentActivity({
  history,
  today = new Date(),
}: RecentActivityProps) {
  const days = buildRecentDays(today, DAYS, history)
  // 合計は必ずこの 7 日分から数える。history には窓の外の日付（未来も含む）が入りうる
  const totalStages = days.reduce((sum, day) => sum + day.count, 0)
  const studiedDays = days.filter((day) => day.count > 0).length

  return (
    <section className="recent-activity">
      {/*
        見出し要素にはしない。トップ画面はカテゴリ名が h2 で並んでおり、
        そこに別の h2 が混ざると見出しの一覧が意味をなさなくなる
      */}
      <p className="recent-activity-summary">
        <span>この7日間</span>
        <span>
          {totalStages} ステージ / {studiedDays} 日
        </span>
      </p>

      <div role="table" aria-label="この7日間の学習">
        <div className="calendar-week" role="row">
          {days.map((day) => (
            <span
              key={day.dateKey}
              className="calendar-weekday"
              role="columnheader"
            >
              {WEEKDAY_LABELS[day.weekday]}
            </span>
          ))}
        </div>
        <div className="calendar-week" role="row">
          {days.map((day, i) => (
            <span
              key={day.dateKey}
              className={`calendar-cell heat-${heatLevel(day.count)}${
                i === days.length - 1 ? ' is-today' : ''
              }`}
              role="cell"
              aria-label={formatDayLabel(day.month, day.day, day.count)}
              title={formatDayLabel(day.month, day.day, day.count)}
            >
              {day.count > 0 ? day.count : ''}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
