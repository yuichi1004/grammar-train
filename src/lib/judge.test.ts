import { describe, it, expect } from 'vitest'
import { judge } from './judge'
import type { Question } from '../types'

function q(answer: string, accept?: string[]): Question {
  return {
    sentence: 'I arrived ___ the station.',
    answer,
    accept,
    translation: '駅に着いた。',
    explanation: '',
  }
}

describe('judge', () => {
  it('完全一致で正解', () => {
    expect(judge(q('at'), 'at')).toBe(true)
  })

  it('不一致は不正解', () => {
    expect(judge(q('at'), 'on')).toBe(false)
  })

  it('大文字小文字を無視する', () => {
    expect(judge(q('at'), 'At')).toBe(true)
    expect(judge(q('The'), 'the')).toBe(true)
  })

  it('前後の空白を無視する', () => {
    expect(judge(q('at'), '  at ')).toBe(true)
  })

  it('語間の連続空白は 1 つに正規化する', () => {
    expect(judge(q('a lot of'), 'a  lot   of')).toBe(true)
  })

  it('accept の別解でも正解', () => {
    expect(judge(q('cannot', ["can't"]), "can't")).toBe(true)
  })

  it('無冠詞（空文字列の answer）は空入力で正解', () => {
    expect(judge(q(''), '')).toBe(true)
    expect(judge(q(''), '  ')).toBe(true)
    expect(judge(q(''), 'the')).toBe(false)
  })

  it('answer が空でないのに空入力は不正解', () => {
    expect(judge(q('at'), '')).toBe(false)
  })
})
