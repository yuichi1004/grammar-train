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
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}} />)
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
    render(<StageSelect stages={stages} records={records} onSelect={vi.fn()} onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}} />)
    expect(screen.getByText(/前回 80%/)).toBeInTheDocument()
  })

  it('未プレイのステージは「未挑戦」と表示される', () => {
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}} />)
    expect(screen.getAllByText('未挑戦')).toHaveLength(2)
  })

  it('カテゴリのラベルが日本語で表示される', () => {
    render(<StageSelect stages={stages} records={{}} onSelect={vi.fn()} onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}} />)
    expect(screen.getByText('前置詞')).toBeInTheDocument()
    expect(screen.getByText('冠詞')).toBeInTheDocument()
  })

  it('ステージを選ぶと onSelect が呼ばれる', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<StageSelect stages={stages} records={{}} onSelect={onSelect} onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}} />)
    await user.click(screen.getByRole('button', { name: /ステージ A/ }))
    expect(onSelect).toHaveBeenCalledWith(stages[0])
  })

  it('カテゴリの見出しでグループ化して表示する', () => {
    render(
      <StageSelect
        stages={stages}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}}
      />,
    )
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(['前置詞', '冠詞'])
  })

  it('見出しは preposition → article → noun → tense → scene の順に並ぶ', () => {
    const mixed = [
      makeTestStage({ id: 's', title: '場面', category: 'scene' }),
      makeTestStage({ id: 'n', title: '名詞', category: 'noun' }),
      makeTestStage({ id: 't', title: '時制', category: 'tense' }),
      makeTestStage({ id: 'a', title: '冠詞ステージ', category: 'article' }),
      makeTestStage({ id: 'p', title: '前置詞ステージ' }),
    ]
    render(
      <StageSelect
        stages={mixed}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}}
      />,
    )
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual([
      '前置詞',
      '冠詞',
      '名詞',
      '時制',
      '場面',
    ])
  })

  it('グループ内は渡された順（order 昇順）を保つ', () => {
    const three = [
      makeTestStage({ id: 'p1', title: '前置詞 1' }),
      makeTestStage({ id: 'p2', title: '前置詞 2' }),
      makeTestStage({ id: 'p3', title: '前置詞 3' }),
    ]
    render(
      <StageSelect
        stages={three}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}}
      />,
    )
    const titles = screen
      .getAllByRole('button')
      .map((b) => b.querySelector('.stage-title')?.textContent)
      .filter(Boolean)
    expect(titles).toEqual(['前置詞 1', '前置詞 2', '前置詞 3'])
  })

  it('該当ステージのないカテゴリの見出しは表示しない', () => {
    render(
      <StageSelect
        stages={[makeTestStage({ id: 'only' })]}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{}}
      />,
    )
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(['前置詞'])
  })

  it('「学習記録」で onShowHistory が呼ばれる', async () => {
    const user = userEvent.setup()
    const onShowHistory = vi.fn()
    render(
      <StageSelect
        stages={stages}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={onShowHistory}
        onShowSettings={vi.fn()}
        history={{}}
      />,
    )
    await user.click(screen.getByRole('button', { name: '学習記録' }))
    expect(onShowHistory).toHaveBeenCalled()
  })

  it('直近 7 日間のヒートマップが表示される', () => {
    render(
      <StageSelect
        stages={stages}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={vi.fn()}
        history={{ '2026-07-22': 2 }}
        today={new Date(2026, 6, 22)}
      />,
    )
    expect(screen.getAllByRole('cell')).toHaveLength(7)
    expect(
      screen.getByRole('cell', { name: '7月22日 2ステージ' }),
    ).toBeInTheDocument()
  })

  it('「設定」で onShowSettings が呼ばれる', async () => {
    const user = userEvent.setup()
    const onShowSettings = vi.fn()
    render(
      <StageSelect
        stages={stages}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
        onShowSettings={onShowSettings}
        history={{}}
      />,
    )
    await user.click(screen.getByRole('button', { name: '設定' }))
    expect(onShowSettings).toHaveBeenCalled()
  })
})
