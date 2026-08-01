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

  it('全問終了で onFinish が正解数と不正解の問題とともに呼ばれる', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    const { stage } = setup(onFinish)
    // 1問目: 正解 / 2問目: 不正解 / 3問目: 正解
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'xx{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'on{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(onFinish).toHaveBeenCalledWith(2, [stage.questions[1]])
  })

  it('全問正解なら不正解の配列は空', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    setup(onFinish)
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'in{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'on{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(onFinish).toHaveBeenCalledWith(3, [])
  })

  // onFinish は「判定」とは別のイベント（次へ）で呼ばれるので、最後の問題の判定も
  // 反映済みになる。ここを崩す実装変更（判定と同時に onFinish を呼ぶなど）を検出する
  it('最後の問題を間違えても正解数と不正解の配列に反映される', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    const { stage } = setup(onFinish)
    await user.type(screen.getByRole('textbox'), 'at{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'in{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'xx{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    expect(onFinish).toHaveBeenCalledWith(2, [stage.questions[2]])
  })

  // 復習では受け取った配列をそのまま出題するので、同一オブジェクトである必要がある
  it('不正解の配列には出題された問題オブジェクトそのものが入る', async () => {
    const user = userEvent.setup()
    const onFinish = vi.fn()
    const { stage } = setup(onFinish)
    await user.type(screen.getByRole('textbox'), 'xx{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'in{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    await user.type(screen.getByRole('textbox'), 'on{Enter}')
    await user.click(screen.getByRole('button', { name: '次へ' }))
    const wrong = onFinish.mock.calls[0][1] as unknown[]
    expect(wrong[0]).toBe(stage.questions[0])
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

  describe('復習モード', () => {
    it('reviewQuestions を渡すとその問題だけが出題される', () => {
      const stage = makeTestStage()
      render(
        <Quiz
          stage={stage}
          reviewQuestions={[stage.questions[1]]}
          onFinish={vi.fn()}
          onQuit={vi.fn()}
        />,
      )
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
      expect(screen.getByText(/She lives/)).toBeInTheDocument()
      expect(screen.queryByText(/I arrived/)).not.toBeInTheDocument()
    })

    it('復習中は復習であることが表示される', () => {
      const stage = makeTestStage()
      render(
        <Quiz
          stage={stage}
          reviewQuestions={[stage.questions[0]]}
          onFinish={vi.fn()}
          onQuit={vi.fn()}
        />,
      )
      expect(screen.getByText('復習')).toBeInTheDocument()
    })

    it('通常のクイズでは復習表示が出ない', () => {
      setup()
      expect(screen.queryByText('復習')).not.toBeInTheDocument()
    })

    it('復習中もステージの hint は表示される', () => {
      const stage = makeTestStage({ hint: '括弧内の語を文に合う形にして入力' })
      render(
        <Quiz
          stage={stage}
          reviewQuestions={[stage.questions[0]]}
          onFinish={vi.fn()}
          onQuit={vi.fn()}
        />,
      )
      expect(
        screen.getByText('括弧内の語を文に合う形にして入力'),
      ).toBeInTheDocument()
    })

    // 空欄ヒントを出題中の配列から判定すると、答えが空欄の1問だけを復習したときに
    // 答えそのものが漏れる。ステージ全体で判定していれば漏れない。
    it('空欄ヒントは出題中の問題ではなくステージ全体から判定する', () => {
      const stage = makeTestStage({ category: 'article' })
      stage.questions[2] = { ...stage.questions[2], answer: '' }
      render(
        <Quiz
          stage={stage}
          reviewQuestions={[stage.questions[0]]}
          onFinish={vi.fn()}
          onQuit={vi.fn()}
        />,
      )
      // 出題中の1問の答えは空欄ではないが、ステージには空欄の問題があるのでヒントは出る
      expect(screen.getByText(/空欄のまま/)).toBeInTheDocument()
    })

    it('復習でも不正解の問題は onFinish に渡される', async () => {
      const user = userEvent.setup()
      const onFinish = vi.fn()
      const stage = makeTestStage()
      render(
        <Quiz
          stage={stage}
          reviewQuestions={[stage.questions[1]]}
          onFinish={onFinish}
          onQuit={vi.fn()}
        />,
      )
      await user.type(screen.getByRole('textbox'), 'xx{Enter}')
      await user.click(screen.getByRole('button', { name: '次へ' }))
      expect(onFinish).toHaveBeenCalledWith(0, [stage.questions[1]])
    })
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
