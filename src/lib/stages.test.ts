import { describe, it, expect } from 'vitest'
import { validateStage, validateStages, QUESTIONS_PER_STAGE } from './stages'

const validQuestion = {
  sentence: 'I arrived ___ the station.',
  answer: 'at',
  translation: '駅に着いた。',
  explanation: '地点には at。',
}

function makeStage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-1',
    title: 'テスト',
    category: 'preposition',
    description: 'テスト用',
    questions: Array.from({ length: QUESTIONS_PER_STAGE }, () => ({
      ...validQuestion,
    })),
    ...overrides,
  }
}

describe('validateStage', () => {
  it('正しいステージを受理する', () => {
    expect(() => validateStage(makeStage())).not.toThrow()
  })

  it('問題数が 30 でなければエラー', () => {
    expect(() => validateStage(makeStage({ questions: [validQuestion] }))).toThrow(
      /30/,
    )
  })

  it('空欄 ___ がない問題はエラー', () => {
    const questions = Array.from({ length: QUESTIONS_PER_STAGE }, () => ({
      ...validQuestion,
    }))
    questions[3] = { ...validQuestion, sentence: 'No blank here.' }
    expect(() => validateStage(makeStage({ questions }))).toThrow(/___/)
  })

  it('不正なカテゴリはエラー', () => {
    expect(() => validateStage(makeStage({ category: 'verb' }))).toThrow(
      /category/,
    )
  })

  it('id や title が欠けているとエラー', () => {
    expect(() => validateStage(makeStage({ id: '' }))).toThrow(/id/)
    expect(() => validateStage(makeStage({ title: '' }))).toThrow(/title/)
  })

  it('answer が空でも冠詞カテゴリなら受理する（無冠詞）', () => {
    const questions = Array.from({ length: QUESTIONS_PER_STAGE }, () => ({
      ...validQuestion,
    }))
    questions[0] = { ...validQuestion, answer: '' }
    expect(() =>
      validateStage(makeStage({ category: 'article', questions })),
    ).not.toThrow()
  })
})

describe('validateStages', () => {
  it('id の重複はエラー', () => {
    expect(() => validateStages([makeStage(), makeStage()])).toThrow(
      /duplicate/i,
    )
  })

  it('重複がなければ全ステージを返す', () => {
    const stages = validateStages([
      makeStage({ id: 'a' }),
      makeStage({ id: 'b' }),
    ])
    expect(stages.map((s) => s.id)).toEqual(['a', 'b'])
  })
})
