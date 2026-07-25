import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  validateStage,
  validateStages,
  sortStages,
  loadStages,
  MIN_QUESTIONS,
} from './stages'
import type { Stage } from '../types'

const validQuestion = {
  sentence: 'I arrived ___ the station.',
  answer: 'at',
  translation: '駅に着いた。',
  explanation: 'at のイメージは「点」。駅を一地点として捉えている。',
}

function makeStage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-1',
    order: 10,
    title: 'テスト',
    category: 'preposition',
    description: 'テスト用',
    questions: Array.from({ length: 30 }, () => ({ ...validQuestion })),
    ...overrides,
  }
}

describe('validateStage', () => {
  it('正しいステージを受理する', () => {
    expect(() => validateStage(makeStage())).not.toThrow()
  })

  it('問題数が 30 でなくても受理する', () => {
    expect(() =>
      validateStage(makeStage({ questions: [validQuestion] })),
    ).not.toThrow()
    expect(() =>
      validateStage(
        makeStage({
          questions: Array.from({ length: 50 }, () => ({ ...validQuestion })),
        }),
      ),
    ).not.toThrow()
  })

  it('問題が 0 問のステージはエラー', () => {
    expect(() => validateStage(makeStage({ questions: [] }))).toThrow(
      new RegExp(String(MIN_QUESTIONS)),
    )
  })

  it('空欄 ___ がない問題はエラー', () => {
    const questions = Array.from({ length: 3 }, () => ({ ...validQuestion }))
    questions[1] = { ...validQuestion, sentence: 'No blank here.' }
    expect(() => validateStage(makeStage({ questions }))).toThrow(/___/)
  })

  it('不正なカテゴリはエラー', () => {
    expect(() => validateStage(makeStage({ category: 'verb' }))).toThrow(
      /category/,
    )
  })

  it('時制・場面カテゴリを受理する', () => {
    expect(() => validateStage(makeStage({ category: 'tense' }))).not.toThrow()
    expect(() => validateStage(makeStage({ category: 'scene' }))).not.toThrow()
  })

  it('hint は省略できるが、あれば非空の文字列', () => {
    expect(() =>
      validateStage(makeStage({ hint: '括弧内の語を文に合う形にして入力' })),
    ).not.toThrow()
    expect(() => validateStage(makeStage({ hint: '' }))).toThrow(/hint/)
    expect(() => validateStage(makeStage({ hint: 42 }))).toThrow(/hint/)
  })

  it('id や title が欠けているとエラー', () => {
    expect(() => validateStage(makeStage({ id: '' }))).toThrow(/id/)
    expect(() => validateStage(makeStage({ title: '' }))).toThrow(/title/)
  })

  it('order は省略できる', () => {
    const stage = makeStage()
    delete (stage as Record<string, unknown>).order
    expect(() => validateStage(stage)).not.toThrow()
  })

  it('order が数値でなければエラー', () => {
    expect(() => validateStage(makeStage({ order: '10' }))).toThrow(/order/)
    expect(() => validateStage(makeStage({ order: Number.NaN }))).toThrow(
      /order/,
    )
  })

  it('answer が空でも受理する（無冠詞・前置詞なし）', () => {
    const questions = [{ ...validQuestion, answer: '' }]
    expect(() =>
      validateStage(makeStage({ category: 'article', questions })),
    ).not.toThrow()
    expect(() =>
      validateStage(makeStage({ category: 'scene', questions })),
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

  it('1 つでも壊れていれば throw する（テスト・CI 用の厳格版）', () => {
    expect(() =>
      validateStages([makeStage({ id: 'a' }), makeStage({ id: 'b', title: '' })]),
    ).toThrow(/title/)
  })
})

/** sortStages / loadStages 用に最小限のステージを作る */
function stage(id: string, order?: number): Stage {
  return {
    id,
    ...(order === undefined ? {} : { order }),
    title: id,
    category: 'preposition',
    description: '',
    questions: [validQuestion],
  }
}

describe('sortStages', () => {
  it('order の昇順に並べる', () => {
    const sorted = sortStages([stage('c', 30), stage('a', 10), stage('b', 20)])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('間の order で割り込める', () => {
    const sorted = sortStages([stage('a', 10), stage('c', 20), stage('b', 15)])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('order 未指定は末尾に元の順で残る', () => {
    const sorted = sortStages([stage('x'), stage('y'), stage('a', 10)])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'x', 'y'])
  })

  it('同じ order は元の順を保つ（安定ソート）', () => {
    const sorted = sortStages([stage('a', 10), stage('b', 10), stage('c', 10)])
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('元の配列を書き換えない', () => {
    const input = [stage('b', 20), stage('a', 10)]
    sortStages(input)
    expect(input.map((s) => s.id)).toEqual(['b', 'a'])
  })
})

describe('loadStages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('正しいステージはそのまま返す', () => {
    const loaded = loadStages([makeStage({ id: 'a' }), makeStage({ id: 'b' })])
    expect(loaded.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('壊れたステージだけ除外して残りは返す', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const loaded = loadStages([
      makeStage({ id: 'a' }),
      makeStage({ id: 'broken', questions: [] }),
      makeStage({ id: 'b' }),
    ])
    expect(loaded.map((s) => s.id)).toEqual(['a', 'b'])
    expect(error).toHaveBeenCalled()
  })

  it('id が重複したら先に来たものを採用する', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const loaded = loadStages([
      makeStage({ id: 'a', title: '先' }),
      makeStage({ id: 'a', title: '後' }),
    ])
    expect(loaded).toHaveLength(1)
    expect(loaded[0].title).toBe('先')
    expect(error).toHaveBeenCalled()
  })

  it('全部壊れていれば空配列を返す（アプリは白画面にしない）', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(loadStages([{ nonsense: true }, null])).toEqual([])
  })
})
