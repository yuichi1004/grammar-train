import { describe, it, expect } from 'vitest'
import { stages } from './index'
import { QUESTIONS_PER_STAGE } from '../lib/stages'

describe('ステージデータ', () => {
  it('6 ステージが読み込まれる', () => {
    expect(stages).toHaveLength(6)
  })

  it('全ステージが 30 問持つ', () => {
    for (const stage of stages) {
      expect(stage.questions, stage.id).toHaveLength(QUESTIONS_PER_STAGE)
    }
  })

  it('id が重複していない', () => {
    const ids = stages.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
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
