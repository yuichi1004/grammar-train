import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Quiz } from './Quiz'
import { makeTestStage } from '../test-fixtures'

/**
 * Quiz.test.tsx では lib/shuffle をモックして出題順を固定しているので、
 * 実際にシャッフルが配線されていることはここで別途確かめる。
 */
describe('Quiz の出題順シャッフル', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('マウント時に shuffle.ts と同じアルゴリズムで並び替えて出題する', () => {
    // shuffle(['Q0','Q1','Q2','Q3'], () => 0) は ['Q1','Q2','Q3','Q0'] になる
    // （shuffle.test.ts で確認済みの Fisher-Yates の挙動）。
    // random を常に 0 にして固定し、1問目に Q1 が出ることを確かめる。
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const stage = makeTestStage({
      questions: [
        { sentence: 'Q0 ___.', answer: 'a', translation: '問題0', explanation: '説明0' },
        { sentence: 'Q1 ___.', answer: 'b', translation: '問題1', explanation: '説明1' },
        { sentence: 'Q2 ___.', answer: 'c', translation: '問題2', explanation: '説明2' },
        { sentence: 'Q3 ___.', answer: 'd', translation: '問題3', explanation: '説明3' },
      ],
    })
    render(<Quiz stage={stage} onFinish={vi.fn()} onQuit={vi.fn()} />)

    expect(screen.getByText('問題1')).toBeInTheDocument()
    expect(screen.getByText(/Q1/)).toBeInTheDocument()
  })
})
