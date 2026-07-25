import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Quiz } from '../components/Quiz'
import { StageSelect } from '../components/StageSelect'
import { stages } from './index'
import { judge } from '../lib/judge'
import type { Stage } from '../types'

// 完走テストは stage.questions を元の順番のまま1問ずつ答えていくので、
// シャッフルはここでは無効化する。シャッフルそのものは lib/shuffle.test.ts と
// components/Quiz.shuffle.test.tsx で検証する。
vi.mock('../lib/shuffle', () => ({
  shuffle: <T,>(items: T[]) => items,
}))

/**
 * 本番のステージデータを実際の UI に流し込む通し確認。
 * 単体テストがダミーデータで通っていても、実データで壊れていたら意味がないので、
 * 「正しい答えを打ったら必ず正解になる」ことを全 600 問で確かめる。
 */
describe('実データの通し確認', () => {
  it('全問、正解の文字列を入力すると正解と判定される', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        expect(judge(q, q.answer), `${stage.id}[${i}]: "${q.answer}"`).toBe(true)
      }
    }
  })

  it('全問、別解もすべて正解と判定される', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        for (const alt of q.accept ?? []) {
          expect(judge(q, alt), `${stage.id}[${i}]: "${alt}"`).toBe(true)
        }
      }
    }
  })

  it('選択画面に 5 つのカテゴリ見出しと全ステージが並ぶ', () => {
    render(
      <StageSelect
        stages={stages}
        records={{}}
        onSelect={vi.fn()}
        onShowHistory={vi.fn()}
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
    for (const stage of stages) {
      expect(screen.getByText(stage.title)).toBeInTheDocument()
    }
  })

  // 複数語の答え・括弧の cue・hint が実際の画面で通ることを、時制ステージ 1 本で通しで見る
  it('時制ステージを最初から最後まで正解して完走できる', async () => {
    const user = userEvent.setup()
    const stage = stages.find((s) => s.id === 'tense-past-perfect') as Stage
    const onFinish = vi.fn()
    render(<Quiz stage={stage} onFinish={onFinish} onQuit={vi.fn()} />)

    expect(screen.getByText(stage.hint as string)).toBeInTheDocument()

    for (const q of stage.questions) {
      await user.type(screen.getByRole('textbox'), q.answer)
      await user.click(screen.getByRole('button', { name: '答える' }))
      expect(screen.getByText('正解！')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: '次へ' }))
    }
    expect(onFinish).toHaveBeenCalledWith(stage.questions.length)
  })

  // 空欄のまま解答する問題（無冠詞・前置詞なし）が実際に正解になるか
  it('空欄のまま解答する問題が正解になる', async () => {
    const user = userEvent.setup()
    const source = stages.find(
      (s) => s.id === 'scene-business-articles',
    ) as Stage
    const blank = source.questions.find((q) => q.answer === '')
    expect(blank, 'answer が空の問題が見つからない').toBeDefined()
    const stage: Stage = { ...source, questions: [blank!] }

    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)
    expect(screen.getByText(/空欄のまま/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '答える' }))
    expect(screen.getByText('正解！')).toBeInTheDocument()
  })
})
