import { describe, it, expect } from 'vitest'
import {
  buildMonthGrid,
  buildRecentDays,
  chunkIntoWeeks,
  formatDayLabel,
  heatLevel,
  WEEKDAY_LABELS,
} from './calendar'

describe('buildMonthGrid', () => {
  it('月初の曜日ぶん null を先頭に詰める', () => {
    // 2026-07-01 は水曜 (日曜=0 から数えて 3)
    const grid = buildMonthGrid(2026, 6, {})
    expect(grid.slice(0, 3)).toEqual([null, null, null])
    expect(grid[3]).toMatchObject({ day: 1, dateKey: '2026-07-01' })
  })

  it('月初が日曜なら null を詰めない', () => {
    // 2026-03-01 は日曜
    const grid = buildMonthGrid(2026, 2, {})
    expect(grid[0]).toMatchObject({ day: 1, dateKey: '2026-03-01' })
  })

  it('31 日ある月は 31 セル', () => {
    const cells = buildMonthGrid(2026, 6, {}).filter((c) => c !== null)
    expect(cells).toHaveLength(31)
  })

  it('30 日しかない月は 30 セル', () => {
    const cells = buildMonthGrid(2026, 3, {}).filter((c) => c !== null)
    expect(cells).toHaveLength(30)
  })

  it('平年の 2 月は 28 セル', () => {
    const cells = buildMonthGrid(2026, 1, {}).filter((c) => c !== null)
    expect(cells).toHaveLength(28)
  })

  it('うるう年の 2 月は 29 セル', () => {
    const cells = buildMonthGrid(2028, 1, {}).filter((c) => c !== null)
    expect(cells).toHaveLength(29)
  })

  it('履歴のステージ数がセルに載る', () => {
    const grid = buildMonthGrid(2026, 6, { '2026-07-25': 3 })
    const cell = grid.find((c) => c?.dateKey === '2026-07-25')
    expect(cell).toMatchObject({ day: 25, count: 3 })
  })

  it('記録のない日は count が 0', () => {
    const grid = buildMonthGrid(2026, 6, { '2026-07-25': 3 })
    const cell = grid.find((c) => c?.dateKey === '2026-07-01')
    expect(cell?.count).toBe(0)
  })

  it('他の月の記録は混ざらない', () => {
    const grid = buildMonthGrid(2026, 6, { '2026-08-01': 5 })
    expect(grid.every((c) => c === null || c.count === 0)).toBe(true)
  })
})

describe('chunkIntoWeeks', () => {
  it('7 日ずつの週に分ける', () => {
    const weeks = chunkIntoWeeks(buildMonthGrid(2026, 6, {}))
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })

  it('最後の週は null で埋める', () => {
    // 2026-07 は水曜始まりの 31 日 → 3 + 31 = 34 マス → 5 週
    const weeks = chunkIntoWeeks(buildMonthGrid(2026, 6, {}))
    expect(weeks).toHaveLength(5)
    expect(weeks[4].slice(-1)).toEqual([null])
  })
})

describe('buildRecentDays', () => {
  // 2026-07-25 は土曜
  const saturday = new Date(2026, 6, 25)

  it('指定した日数ぶんのマスを古い順に返す', () => {
    const days = buildRecentDays(saturday, 7, {})
    expect(days).toHaveLength(7)
    expect(days.map((d) => d.dateKey)).toEqual([
      '2026-07-19',
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
    ])
  })

  it('今日が右端になる', () => {
    const days = buildRecentDays(saturday, 7, {})
    expect(days.at(-1)).toMatchObject({ dateKey: '2026-07-25', day: 25 })
  })

  it('月をまたいで前の月の日付を返す', () => {
    const days = buildRecentDays(new Date(2026, 7, 2), 7, {})
    expect(days[0].dateKey).toBe('2026-07-27')
    expect(days.at(-1)?.dateKey).toBe('2026-08-02')
  })

  it('年をまたいで前の年の日付を返す', () => {
    const days = buildRecentDays(new Date(2027, 0, 3), 7, {})
    expect(days[0].dateKey).toBe('2026-12-28')
  })

  it('うるう年の 2月29日を含む', () => {
    const days = buildRecentDays(new Date(2028, 2, 2), 7, {})
    expect(days.map((d) => d.dateKey)).toContain('2028-02-29')
  })

  it('平年は 2月29日を作らない', () => {
    const days = buildRecentDays(new Date(2027, 2, 2), 7, {})
    expect(days.map((d) => d.dateKey)).not.toContain('2027-02-29')
    expect(days[0].dateKey).toBe('2027-02-24')
  })

  // ミリ秒引き算（getTime() - n * 86400000）に「単純化」されると、
  // 時刻の持ち越しや夏時間で日付がずれる。ここで固定しておく
  it('時刻を持つ Date を渡してもその日で切り上がる', () => {
    const days = buildRecentDays(new Date(2026, 6, 25, 23, 59, 59), 7, {})
    expect(days.at(-1)?.dateKey).toBe('2026-07-25')
    expect(days[0].dateKey).toBe('2026-07-19')
  })

  it('曜日が入る（0=日）', () => {
    const days = buildRecentDays(saturday, 7, {})
    expect(days.at(-1)?.weekday).toBe(6)
    expect(days[0].weekday).toBe(0)
  })

  it('month は Date に合わせて 0 始まり', () => {
    const days = buildRecentDays(saturday, 7, {})
    expect(days.at(-1)?.month).toBe(6)
  })

  it('履歴のステージ数がマスに載る', () => {
    const days = buildRecentDays(saturday, 7, { '2026-07-23': 3 })
    expect(days.find((d) => d.dateKey === '2026-07-23')?.count).toBe(3)
  })

  it('記録のない日は count が 0', () => {
    const days = buildRecentDays(saturday, 7, { '2026-07-23': 3 })
    expect(days.find((d) => d.dateKey === '2026-07-24')?.count).toBe(0)
  })

  it('窓の外の記録は混ざらない（過去も未来も）', () => {
    const days = buildRecentDays(saturday, 7, {
      '2026-07-18': 9,
      '2026-08-01': 9,
    })
    expect(days.every((d) => d.count === 0)).toBe(true)
  })

  it('days が 1 なら今日だけ', () => {
    const days = buildRecentDays(saturday, 1, {})
    expect(days.map((d) => d.dateKey)).toEqual(['2026-07-25'])
  })

  it('days が 0 なら空', () => {
    expect(buildRecentDays(saturday, 0, {})).toEqual([])
  })
})

describe('WEEKDAY_LABELS', () => {
  it('Date#getDay() の値でそのまま引ける', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7)
    expect(WEEKDAY_LABELS[0]).toBe('日')
    expect(WEEKDAY_LABELS[6]).toBe('土')
    // 2026-07-25 は土曜
    expect(WEEKDAY_LABELS[new Date(2026, 6, 25).getDay()]).toBe('土')
  })
})

describe('formatDayLabel', () => {
  it('記録がある日はステージ数を添える（month は 0 始まり）', () => {
    expect(formatDayLabel(6, 25, 3)).toBe('7月25日 3ステージ')
  })

  it('記録がない日は「記録なし」', () => {
    expect(formatDayLabel(6, 1, 0)).toBe('7月1日 記録なし')
  })
})

describe('heatLevel', () => {
  it('0 はレベル 0（グレー）', () => {
    expect(heatLevel(0)).toBe(0)
  })

  it('数が増えるほど濃くなる', () => {
    expect(heatLevel(1)).toBe(1)
    expect(heatLevel(2)).toBe(2)
    expect(heatLevel(3)).toBe(3)
    expect(heatLevel(4)).toBe(3)
    expect(heatLevel(5)).toBe(4)
  })

  it('たくさんやっても最大は 4 で止まる', () => {
    expect(heatLevel(100)).toBe(4)
  })
})
