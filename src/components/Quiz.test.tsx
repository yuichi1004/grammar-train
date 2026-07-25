import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Quiz } from './Quiz'
import { makeTestStage } from '../test-fixtures'

// このファイルの他のテストは出題順（1問目=at, 2問目=in, ...）に依存しているので、
// シャッフルはここでは無効化する。シャッフルそのものは shuffle.test.ts と
// Quiz.shuffle.test.tsx で検証する。
vi.mock('../lib/shuffle', () => ({
  shuffle: <T,>(items: T[]) => items,
}))

function setup(onFinish = vi.fn(), onQuit = vi.fn()) {
  const stage = makeTestStage()
  render(<Quiz stage={stage} onFinish={onFinish} onQuit={onQuit} />)
  return { stage, onFinish, onQuit }
}

describe('Quiz', () => {
  it('進捗と問題文が表示される', () => {
    setup()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText(/I arrived/)).toBeInTheDocument()
  })

  it('和訳は解答前から表示される', () => {
    setup()
    expect(screen.getByText('駅に着いた。')).toBeInTheDocument()
  })

  it('解答前は解説が表示されない', () => {
    setup()
    expect(screen.queryByText('地点には at。')).not.toBeInTheDocument()
  })

  it('正解を入力すると「正解」と解説が表示される', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    expect(screen.getByText('正解！')).toBeInTheDocument()
    expect(screen.getByText('地点には at。')).toBeInTheDocument()
  })

  it('不正解のときは「不正解」と正解・解説が表示される', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox'), 'on{Enter}')
    expect(screen.getByText('不正解')).toBeInTheDocument()
    expect(screen.getByText(/正解: at/)).toBeInTheDocument()
    expect(screen.getByText('地点には at。')).toBeInTheDocument()
  })

  it('次の問題に進むと和訳も切り替わる', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(screen.getByText('彼女は東京に住んでいる。')).toBeInTheDocument()
    expect(screen.queryByText('駅に着いた。')).not.toBeInTheDocument()
  })

  it('「次へ」で次の問題に進む', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText(/She lives/)).toBeInTheDocument()
  })

  it('全問終了で onFinish が正解数とともに呼ばれる', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    setup(onFinish)
    // 1問目: 正解 / 2問目: 不正解 / 3問目: 正解
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'xx{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'on{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(onFinish).toHaveBeenCalledWith(2)
  })

  it('フィードバック表示中に Enter でも次に進める', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.keyboard('{Enter}')
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  // ヒントの出し分けはカテゴリではなく「空欄の答えを含むか」で決める。
  // 冠詞以外（ビジネス場面の「前置詞を付けない」など）でも空欄解答を出せるようにするため。
  it('答えが空欄の問題を含むステージでは空欄のまま答えるヒントが表示される', () => {
    const stage = makeTestStage({ category: 'article' })
    stage.questions[2] = { ...stage.questions[2], answer: '' }
    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)
    expect(screen.getByText(/空欄のまま/)).toBeInTheDocument()
  })

  it('空欄の答えがないステージではそのヒントを出さない', () => {
    const stage = makeTestStage({ category: 'article' })
    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)
    expect(screen.queryByText(/空欄のまま/)).not.toBeInTheDocument()
  })

  it('ステージの hint が解答前に表示される', () => {
    const stage = makeTestStage({ hint: '括弧内の語を文に合う形にして入力' })
    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)
    expect(
      screen.getByText('括弧内の語を文に合う形にして入力'),
    ).toBeInTheDocument()
  })

  it('解答すると hint は消える', async () => {
    const user = userEvent.setup()
    const stage = makeTestStage({ hint: '括弧内の語を文に合う形にして入力' })
    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    expect(
      screen.queryByText('括弧内の語を文に合う形にして入力'),
    ).not.toBeInTheDocument()
  })

  it('hint がないステージでは何も表示しない', () => {
    setup()
    expect(screen.queryByText(/括弧内/)).not.toBeInTheDocument()
  })

  it('「やめる」で onQuit が呼ばれる', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    const onQuit = vi.fn()
    setup(onFinish, onQuit)
    await user.click(screen.getByRole('button', { name: 'やめる' }))
    expect(onQuit).toHaveBeenCalled()
  })
})
