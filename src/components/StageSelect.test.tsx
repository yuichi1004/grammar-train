import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StageSelect } from './StageSelect'
import { makeTestStage } from '../test-fixtures'
import type { Records } from '../types'

const stages = [
  makeTestStage({ id: 'stage-a', title: 'ステージ A' }),
  makeTestStage({ id: 'stage-b', title: 'ステージ B', category: 'article' }),
]

describe('StageSelect', () => {
  it('全ステージのタイトルが表示される', () => {
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} />)
    expect(screen.getByText('ステージ A')).toBeInTheDocument()
    expect(screen.getByText('ステージ B')).toBeInTheDocument()
  })

  it('前回の正答率が表示される', () => {
    const records: Records = {
      'stage-a': {
        correct: 24,
        total: 30,
        accuracy: 80,
        playedAt: '2026-07-25T00:00:00.000Z',
      },
    }
    render(<StageSelect stages={stages} records={records} onSelect={vi.fn()} />)
    expect(screen.getByText(/前回 80%/)).toBeInTheDocument()
  })

  it('未プレイのステージは「未挑戦」と表示される', () => {
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} />)
    expect(screen.getAllByText('未挑戦')).toHaveLength(2)
  })

  it('カテゴリのラベルが日本語で表示される', () => {
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} />)
    expect(screen.getByText('前置詞')).toBeInTheDocument()
    expect(screen.getByText('冠詞')).toBeInTheDocument()
  })

  it('ステージを選ぶと onSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<StageSelect stages={stages} records={{}} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    expect(onSelect).toHaveBeenCalledWith(stages[0])
  })
})
