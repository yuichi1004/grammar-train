import { useState } from 'react'
import type { StudyHistory as StudyHistoryData } from '../types'
import { buildMonthGrid, chunkIntoWeeks, heatLevel } from '../lib/calendar'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

interface StudyHistoryProps {
  history: StudyHistoryData
  onBack: () => void
  /** テストから固定日を注入できるようにしている */
  today?: Date
}

export function StudyHistory({
  history,
  onBack,
  today = new Date(),
}: StudyHistoryProps) {
  const [{ year, month }, setYearMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const grid = buildMonthGrid(year, month, history)
  const weeks = chunkIntoWeeks(grid)
  const days = grid.filter((cell) => cell !== null)
  const totalStages = days.reduce((sum, cell) => sum + cell.count, 0)
  const studiedDays = days.filter((cell) => cell.count > 0).length

  // 未来に記録はありえないので、今月より先には進めない
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  function shiftMonth(diff: number) {
    const shifted = new Date(year, month + diff, 1)
    setYearMonth({ year: shifted.getFullYear(), month: shifted.getMonth() })
  }

  return (
    <div className="history">
      <header className="history-header">
        <button type="button" className="secondary-button" onClick={onBack}>
          戻る
        </button>
        <h1>学習記録</h1>
      </header>

      <div className="month-nav">
        <button
          type="button"
          className="month-nav-button"
          onClick={() => shiftMonth(-1)}
          aria-label="前の月"
        >
          ‹
        </button>
        <span className="month-label">
          {year}年{month + 1}月
        </span>
        <button
          type="button"
          className="month-nav-button"
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <p className="month-summary">
        {month + 1}月: {totalStages} ステージ / {studiedDays} 日
      </p>

      <div className="calendar-grid" role="grid" aria-label="学習カレンダー">
        <div className="calendar-week" role="row">
          {WEEKDAYS.map((label) => (
            <span key={label} className="calendar-weekday" role="columnheader">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week" role="row">
            {week.map((cell, dayIndex) =>
              cell === null ? (
                <span key={dayIndex} className="calendar-cell is-empty" />
              ) : (
                <span
                  key={cell.dateKey}
                  className={`calendar-cell heat-${heatLevel(cell.count)}`}
                  role="gridcell"
                  // 日付はマスに出さない仕様なので、読み上げとホバーで補う
                  aria-label={`${month + 1}月${cell.day}日 ${
                    cell.count > 0 ? `${cell.count}ステージ` : '記録なし'
                  }`}
                  title={`${month + 1}月${cell.day}日 ${
                    cell.count > 0 ? `${cell.count}ステージ` : '記録なし'
                  }`}
                >
                  {cell.count > 0 ? cell.count : ''}
                </span>
              ),
            )}
          </div>
        ))}
      </div>

      <p className="heat-legend">
        <span className="heat-legend-label">少ない</span>
        <span className="calendar-cell heat-0" />
        <span className="calendar-cell heat-1" />
        <span className="calendar-cell heat-2" />
        <span className="calendar-cell heat-3" />
        <span className="calendar-cell heat-4" />
        <span className="heat-legend-label">多い</span>
      </p>
    </div>
  )
}
