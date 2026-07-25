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

  // 空の answer は「無冠詞」「前置詞を付けない」を問う出題だけの正当な形。
  // それ以外のカテゴリで空なら書き忘れのバグなのでガードする。
  const BLANK_ANSWER_CATEGORIES = ['article', 'scene']

  it('冠詞・場面カテゴリ以外では answer が空でない', () => {
    for (const stage of stages) {
      if (BLANK_ANSWER_CATEGORIES.includes(stage.category)) continue
      for (const [i, q] of stage.questions.entries()) {
        expect(q.answer, `${stage.id}[${i}]`).not.toBe('')
      }
    }
  })

  // judge は大文字小文字と空白しか正規化しない。iOS が ' を ’ に自動変換するので、
  // ' を含む答えは ’ 版も accept に入れないと正答が不正解になる。
  it("' を含む答えには ’（U+2019）版の別解がある", () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        const candidates = [q.answer, ...(q.accept ?? [])]
        for (const candidate of candidates.filter((c) => c.includes("'"))) {
          expect(
            candidates,
            `${stage.id}[${i}]: "${candidate}" の ’ 版が accept にない`,
          ).toContain(candidate.replaceAll("'", '’'))
        }
      }
    }
  })

  // 長い答えはタイプミスによる偽の不正解を増やす（will have been working が上限）
  it('answer は 4 語以内', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        const words = q.answer.split(/\s+/).filter(Boolean)
        expect(words.length, `${stage.id}[${i}]: "${q.answer}"`).toBeLessThanOrEqual(4)
      }
    }
  })

  it('accept に answer と同じ文字列が入っていない', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        expect(q.accept ?? [], `${stage.id}[${i}]`).not.toContain(q.answer)
      }
    }
  })

  it('accept 内に重複がない', () => {
    for (const stage of stages) {
      for (const [i, q] of stage.questions.entries()) {
        const accept = q.accept ?? []
        expect(new Set(accept).size, `${stage.id}[${i}]`).toBe(accept.length)
      }
    }
  })

  it('hint があれば非空の文字列', () => {
    for (const stage of stages) {
      if (stage.hint === undefined) continue
      expect(stage.hint, stage.id).not.toBe('')
    }
  })
})
