import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { makeTestStage } from './test-fixtures'
import { loadRecords } from './lib/storage'
import { loadHistory, toDateKey } from './lib/history'

const stages = [makeTestStage({ id: 'stage-a', title: 'ステージ A' })]

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('起動時にステージ選択画面が表示される', () => {
    render(<App stages={stages} />)
    expect(screen.getByText('ステージ A')).toBeInTheDocument()
  })

  it('ステージ選択からクイズ・結果まで一巡でき、記録が保存される', async () => {
    const user = userEvent.setup()
    render(<App stages={stages} />)

    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    // 2問正解、1問不正解で完走する
    await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'xx{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(loadRecords()['stage-a']).toMatchObject({
      correct: 2,
      total: 3,
      accuracy: 67,
    })

    // ステージ選択に戻ると前回の正答率が見える
    await user.click(screen.getByRole('button', { name: 'ステージ選択へ' }))
    expect(screen.getByText(/前回 67%/)).toBeInTheDocument()
  })

  it('ステージをクリアすると学習記録の今日のマスに反映される', async () => {
    const user = userEvent.setup()
    render(<App stages={stages} />)

    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
    await user.click(screen.getByRole('button', { name: 'ステージ選択へ' }))

    await user.click(screen.getByRole('button', { name: '学習記録' }))
    const now = new Date()
    const todayCell = screen.getByRole('gridcell', {
      name: `${now.getMonth() + 1}月${now.getDate()}日 1ステージ`,
    })
    expect(todayCell).toHaveTextContent('1')

    // 戻るとステージ選択画面に帰る
    await user.click(screen.getByRole('button', { name: '戻る' }))
    expect(screen.getByText('ステージ A')).toBeInTheDocument()
  })

  it('学習記録は localStorage に残る', async () => {
    const user = userEvent.setup()
    render(<App stages={stages} />)
    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
    expect(loadHistory()[toDateKey(new Date())]).toBe(1)
  })

  it('「もう一度」で同じステージを再挑戦できる', async () => {
    const user = userEvent.setup()
    render(<App stages={stages} />)
    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
    await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
    await user.click(screen.getByRole('button', { name: 'もう一度' }))
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })
})
