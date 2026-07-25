import { describe, it, expect } from 'vitest'
import { stages, stageSources } from './index'
import { validateStages, MIN_QUESTIONS } from '../lib/stages'

/**
 * すでに公開したステージの id。localStorage の記録の主キーなので、
 * リネームすると前回の正答率が別ステージに付いたり消えたりする。
 * ステージの追加は自由だが、ここにある id のリネーム・削除はテストで落とす。
 */
const PUBLISHED_IDS = [
  'prepositions-1',
  'prepositions-2',
  'articles-1',
  'articles-2',
  'nouns-1',
  'nouns-2',
]

describe('ステージデータ', () => {
  // 本番は壊れたステージを飛ばす寛容版で読むので、CI ではこの厳格版で不備を検出する
  it('全ステージ JSON が厳格な検証を通る', () => {
    expect(() => validateStages(stageSources)).not.toThrow()
  })

  it('ステージが 1 つ以上読み込まれる', () => {
    expect(stages.length).toBeGreaterThan(0)
  })

  it('壊れたステージがなく、全 JSON が読み込まれている', () => {
    expect(stages).toHaveLength(stageSources.length)
  })

  it('公開済みステージの id が変わっていない', () => {
    const ids = stages.map((s) => s.id)
    for (const id of PUBLISHED_IDS) {
      expect(ids, `id "${id}" が見つからない（リネーム・削除は記録を壊す）`).toContain(
        id,
      )
    }
  })

  it('id が重複していない', () => {
    const ids = stages.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('全ステージに order が振られていて重複しない', () => {
    const orders = stages.map((s) => s.order)
    for (const [i, order] of orders.entries()) {
      expect(order, `${stages[i].id} に order がない`).toBeTypeOf('number')
    }
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('order の昇順に並んでいる', () => {
    const orders = stages.map((s) => s.order ?? Number.MAX_SAFE_INTEGER)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('全ステージが 1 問以上持つ', () => {
    for (const stage of stages) {
      expect(stage.questions.length, stage.id).toBeGreaterThanOrEqual(
        MIN_QUESTIONS,
      )
    }
  })

  it('全問題に空欄・和訳・解説がある', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        const label = `${stage.id}[${i}]`
        expect(q.sentence, label).toContain('___')
        expect(q.translation, label).not.toBe('')
        expect(q.explanation, label).not.toBe('')
      }
    }
  })

  // 解説は「なぜその語を使うのか」というネイティブのイメージを言語化する方針。
  // 「〜には at」のような一言ルールに戻っていないことを長さで最低限ガードする。
  it('解説がイメージを説明できる長さになっている', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        expect(q.explanation.length, `${stage.id}[${i}]`).toBeGreaterThanOrEqual(20)
      }
    }
  })

  it('冠詞カテゴリ以外では answer が空でない', () => {
    for (const stage of stages) {
      if (stage.category === 'article') continue
      for (const [i, q] of stage.questions.entries()) {
        expect(q.answer, `${stage.id}[${i}]`).not.toBe('')
      }
    }
  })
})
