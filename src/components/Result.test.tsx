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

  describe('復習', () => {
    it('onReview が渡されると復習ボタンが表示される', () => {
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          onReview={vi.fn()}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      expect(
        screen.getByRole('button', { name: '間違えた問題を復習' }),
      ).toBeInTheDocument()
    })

    // 復習ボタンを出すかどうかの判断は App 側（設定オフ・間違い0問）に閉じている
    it('onReview がなければ復習ボタンは表示されない', () => {
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      expect(
        screen.queryByRole('button', { name: '間違えた問題を復習' }),
      ).not.toBeInTheDocument()
    })

    it('復習ボタンで onReview が呼ばれる', async () => {
      const user = userEvent.setup()
      const onReview = vi.fn()
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          onReview={onReview}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      await user.click(
        screen.getByRole('button', { name: '間違えた問題を復習' }),
      )
      expect(onReview).toHaveBeenCalled()
    })

    it('復習の成績が表示される', () => {
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          reviewResult={{ correct: 2, total: 2 }}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      expect(screen.getByText(/復習 2 \/ 2/)).toBeInTheDocument()
      expect(screen.getByText(/記録には含みません/)).toBeInTheDocument()
    })

    it('復習の成績があっても正答率と正解数は変わらない', () => {
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          reviewResult={{ correct: 2, total: 2 }}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      expect(screen.getByText('33%')).toBeInTheDocument()
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('復習の成績がなければ復習の行は表示されない', () => {
      render(
        <Result
          stage={makeTestStage()}
          correct={1}
          total={3}
          onRetry={vi.fn()}
          onBack={vi.fn()}
        />,
      )
      expect(screen.queryByText(/記録には含みません/)).not.toBeInTheDocument()
    })
  })
})
