import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyHistory } from './StudyHistory'

const today = new Date(2026, 6, 25)

function setup(
  history: Record<string, number> = {},
  onBack = vi.fn(),
  now = today,
) {
  render(<StudyHistory history={history} onBack={onBack} today={now} />)
  return { onBack }
}

describe('StudyHistory', () => {
  it('今月の年月が表示される', () => {
    setup()
    expect(screen.getByText('2026年7月')).toBeInTheDocument()
  })

  it('記録のある日にステージ数が表示される', () => {
    setup({ '2026-07-25': 3 })
    expect(
      screen.getByRole('gridcell', { name: '7月25日 3ステージ' }),
    ).toHaveTextContent('3')
  })

  it('記録のない日は数が表示されない', () => {
    setup({ '2026-07-25': 3 })
    expect(
      screen.getByRole('gridcell', { name: '7月1日 記録なし' }),
    ).toHaveTextContent('')
  })

  it('ステージ数に応じてヒートマップの濃さが変わる', () => {
    setup({ '2026-07-01': 1, '2026-07-02': 5 })
    expect(screen.getByRole('gridcell', { name: /7月1日/ })).toHaveClass('heat-1')
    expect(screen.getByRole('gridcell', { name: /7月2日/ })).toHaveClass('heat-4')
    expect(screen.getByRole('gridcell', { name: /7月3日/ })).toHaveClass('heat-0')
  })

  it('その月の合計が表示される', () => {
    setup({ '2026-07-01': 1, '2026-07-02': 5, '2026-06-30': 9 })
    expect(screen.getByText(/6 ステージ/)).toBeInTheDocument()
    expect(screen.getByText(/2 日/)).toBeInTheDocument()
  })

  it('前月ボタンで前の月に移動できる', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: '前の月' }))
    expect(screen.getByText('2026年6月')).toBeInTheDocument()
  })

  it('年をまたいで前月に移動できる', async () => {
    const user = userEvent.setup()
    setup({}, vi.fn(), new Date(2026, 0, 15))
    await user.click(screen.getByRole('button', { name: '前の月' }))
    expect(screen.getByText('2025年12月')).toBeInTheDocument()
  })

  it('今月を表示中は翌月ボタンが押せない', () => {
    setup()
    expect(screen.getByRole('button', { name: '次の月' })).toBeDisabled()
  })

  it('前月に移動すると翌月ボタンで戻れる', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: '前の月' }))
    await user.click(screen.getByRole('button', { name: '次の月' }))
    expect(screen.getByText('2026年7月')).toBeInTheDocument()
  })

  it('「戻る」で onBack が呼ばれる', async () => {
    const user = userEvent.setup()
    const { onBack } = setup()
    await user.click(screen.getByRole('button', { name: '戻る' }))
    expect(onBack).toHaveBeenCalled()
  })
})
