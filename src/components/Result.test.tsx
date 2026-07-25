import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Result } from './Result'
import { makeTestStage } from '../test-fixtures'

describe('Result', () => {
  it('正解数と正答率が表示される', () => {
    render(
      <Result
        stage={makeTestStage()}
        correct={24}
        total={30}
        onRetry={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByText('24 / 30')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
  })

  it('「もう一度」で onRetry が呼ばれる', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <Result
        stage={makeTestStage()}
        correct={1}
        total={3}
        onRetry={onRetry}
        onBack={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'もう一度' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('「ステージ選択へ」で onBack が呼ばれる', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(
      <Result
        stage={makeTestStage()}
        correct={1}
        total={3}
        onRetry={vi.fn()}
        onBack={onBack}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'ステージ選択へ' }))
    expect(onBack).toHaveBeenCalled()
  })
})
