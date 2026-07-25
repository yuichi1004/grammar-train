import { describe, it, expect } from 'vitest'
import { buildMonthGrid, chunkIntoWeeks, heatLevel } from './calendar'

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
