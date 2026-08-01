import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecentActivity } from './RecentActivity'

// 2026-07-22 は水曜。土曜を使うと曜日ラベルがたまたま 日〜土 の並びと一致してしまい、
// 「ラベルを回さず固定で並べる」実装のバグを見逃す
const wednesday = new Date(2026, 6, 22)

function setup(history: Record<string, number> = {}, today = wednesday) {
  render(<RecentActivity history={history} today={today} />)
}

describe('RecentActivity', () => {
  it('7 日ぶんのマスが並ぶ', () => {
    setup()
    expect(screen.getAllByRole('cell')).toHaveLength(7)
  })

  it('今日が右端になる', () => {
    setup()
    const cells = screen.getAllByRole('cell')
    expect(cells.at(-1)).toHaveAccessibleName('7月22日 記録なし')
  })

  // 直近 7 日のローリング表示なので、曜日ラベルは今日の曜日で終わる並びになる
  it('曜日ラベルは今日の曜日で終わる並びになる', () => {
    setup()
    const headers = screen.getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual([
      '木',
      '金',
      '土',
      '日',
      '月',
      '火',
      '水',
    ])
  })

  it('記録のある日はステージ数が読み上げられる', () => {
    setup({ '2026-07-20': 2 })
    expect(
      screen.getByRole('cell', { name: '7月20日 2ステージ' }),
    ).toHaveTextContent('2')
  })

  it('記録のない日は「記録なし」で数も出ない', () => {
    setup({ '2026-07-20': 2 })
    expect(
      screen.getByRole('cell', { name: '7月19日 記録なし' }),
    ).toHaveTextContent('')
  })

  it('ステージ数に応じてヒートマップの濃さが変わる', () => {
    setup({ '2026-07-20': 1, '2026-07-21': 5 })
    expect(screen.getByRole('cell', { name: /7月20日/ })).toHaveClass('heat-1')
    expect(screen.getByRole('cell', { name: /7月21日/ })).toHaveClass('heat-4')
    expect(screen.getByRole('cell', { name: /7月19日/ })).toHaveClass('heat-0')
  })

  it('月をまたいでも正しい日付になる', () => {
    setup({}, new Date(2026, 7, 2))
    const cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveAccessibleName('7月27日 記録なし')
    expect(cells.at(-1)).toHaveAccessibleName('8月2日 記録なし')
  })

  it('記録が 1 件もなくてもマスは出る', () => {
    setup()
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(7)
    expect(cells.every((cell) => cell.classList.contains('heat-0'))).toBe(true)
  })

  it('この 7 日間の合計が表示される', () => {
    setup({ '2026-07-20': 2, '2026-07-22': 3 })
    expect(screen.getByText(/5 ステージ/)).toBeInTheDocument()
    expect(screen.getByText(/2 日/)).toBeInTheDocument()
  })

  // 履歴には窓の外の日付（未来も含む）が入りうる。合計は 7 日分から数えること
  it('窓の外の記録は合計に含めない', () => {
    setup({ '2026-07-22': 3, '2026-07-15': 9, '2026-08-01': 9 })
    expect(screen.getByText(/3 ステージ/)).toBeInTheDocument()
    expect(screen.getByText(/1 日/)).toBeInTheDocument()
  })

  // トップ画面のカテゴリ見出し（h2）と衝突させないため、見出し要素は使わない
  it('見出し要素を作らない', () => {
    setup()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
