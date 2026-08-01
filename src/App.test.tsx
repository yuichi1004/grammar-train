import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { makeTestStage } from './test-fixtures'
import { loadRecords } from './lib/storage'
import { loadHistory, toDateKey } from './lib/history'
import { loadSettings, SETTINGS_KEY } from './lib/settings'

// このファイルのテストは「1問目=at, 2問目=in, ...」という出題順に依存しているので、
// シャッフルはここでは無効化する。シャッフルそのものは lib/shuffle.test.ts と
// components/Quiz.shuffle.test.tsx で検証する。
vi.mock('./lib/shuffle', () => ({
  shuffle: <T,>(items: T[]) => items,
}))

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

  describe('復習セッション', () => {
    /** 2問目だけ間違えて完走する（正答率 67%、間違いは She lives ___ Tokyo.） */
    async function playWithOneMistake(user: ReturnType<typeof userEvent.setup>) {
      await user.click(screen.getByRole('button', { name: /ステージ A/ }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'xx{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
    }

    it('結果画面から間違えた問題だけを復習できる', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)

      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
      expect(screen.getByText(/She lives/)).toBeInTheDocument()
      expect(screen.queryByText(/I arrived/)).not.toBeInTheDocument()
    })

    it('全問正解なら復習ボタンは出ない', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: /ステージ A/ }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
      expect(
        screen.queryByRole('button', { name: '間違えた問題を復習' }),
      ).not.toBeInTheDocument()
    })

    it('復習で正解しても保存された正答率は変わらない', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      expect(loadRecords()['stage-a'].accuracy).toBe(67)

      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')

      expect(loadRecords()['stage-a']).toMatchObject({
        correct: 2,
        total: 3,
        accuracy: 67,
      })
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('復習しても学習記録のクリア数は増えない', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      expect(loadHistory()[toDateKey(new Date())]).toBe(1)

      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')

      expect(loadHistory()[toDateKey(new Date())]).toBe(1)
    })

    it('復習の成績が結果画面に表示される', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      expect(screen.getByText(/復習 1 \/ 1/)).toBeInTheDocument()
      expect(screen.getByText(/記録には含みません/)).toBeInTheDocument()
    })

    it('復習を「やめる」と結果画面に戻る', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.click(screen.getByRole('button', { name: 'やめる' }))

      expect(screen.getByText('67%')).toBeInTheDocument()
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
      // 復習ボタンは残り、もう一度復習できる
      expect(
        screen.getByRole('button', { name: '間違えた問題を復習' }),
      ).toBeInTheDocument()
    })

    it('復習後に「もう一度」でやり直すと復習の成績表示は消える', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      expect(screen.getByText(/記録には含みません/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'もう一度' }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')

      expect(screen.queryByText(/記録には含みません/)).not.toBeInTheDocument()
    })

    // Quiz の描画箇所を1つにまとめると index が持ち越されてしまう。その退行を検出する
    it('復習を2回続けて始めても1問目から始まる', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      expect(screen.getByText('1 / 1')).toBeInTheDocument()
      expect(screen.getByText(/She lives/)).toBeInTheDocument()
    })

    it('設定で復習をオフにすると復習ボタンが出ない', async () => {
      // App は起動時に一度だけ設定を読むので、render の前に仕込む
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ reviewEnabled: false }),
      )
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await playWithOneMistake(user)
      expect(
        screen.queryByRole('button', { name: '間違えた問題を復習' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('トップの直近 7 日間', () => {
    /** 今日のマスの読み上げ名。学習記録画面の gridcell とは role が違う */
    function todayCellName(stages: number) {
      const now = new Date()
      return `${now.getMonth() + 1}月${now.getDate()}日 ${stages}ステージ`
    }

    it('まだ何もしていなければ今日のマスは記録なし', () => {
      render(<App stages={stages} />)
      const now = new Date()
      expect(
        screen.getByRole('cell', {
          name: `${now.getMonth() + 1}月${now.getDate()}日 記録なし`,
        }),
      ).toBeInTheDocument()
    })

    it('ステージをクリアすると今日のマスが埋まる', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: /ステージ A/ }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')
      await user.click(screen.getByRole('button', { name: 'ステージ選択へ' }))

      expect(
        screen.getByRole('cell', { name: todayCellName(1) }),
      ).toHaveTextContent('1')
    })

    // handleFinish と handleReviewFinish を分けている理由を UI 側から固定する
    it('復習しても今日のマスは増えない', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: /ステージ A/ }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'xx{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')

      await user.click(screen.getByRole('button', { name: '間違えた問題を復習' }))
      await user.type(screen.getByRole('textbox'), 'in{Enter}{Enter}')
      await user.click(screen.getByRole('button', { name: 'ステージ選択へ' }))

      expect(
        screen.getByRole('cell', { name: todayCellName(1) }),
      ).toHaveTextContent('1')
      expect(
        screen.queryByRole('cell', { name: todayCellName(2) }),
      ).not.toBeInTheDocument()
    })
  })

  describe('設定画面', () => {
    it('設定画面で復習をオフにすると保存される', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: '設定' }))
      await user.click(screen.getByRole('checkbox', { name: /復習/ }))
      expect(loadSettings().reviewEnabled).toBe(false)
    })

    it('設定を変えるとその場で結果画面に反映される', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: '設定' }))
      await user.click(screen.getByRole('checkbox', { name: /復習/ }))
      await user.click(screen.getByRole('button', { name: '戻る' }))

      await user.click(screen.getByRole('button', { name: /ステージ A/ }))
      await user.type(screen.getByRole('textbox'), 'at{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'xx{Enter}{Enter}')
      await user.type(screen.getByRole('textbox'), 'on{Enter}{Enter}')

      expect(
        screen.queryByRole('button', { name: '間違えた問題を復習' }),
      ).not.toBeInTheDocument()
    })

    it('設定画面の「戻る」でステージ選択に戻る', async () => {
      const user = userEvent.setup()
      render(<App stages={stages} />)
      await user.click(screen.getByRole('button', { name: '設定' }))
      await user.click(screen.getByRole('button', { name: '戻る' }))
      expect(screen.getByText('ステージ A')).toBeInTheDocument()
    })
  })
})
