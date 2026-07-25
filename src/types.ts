export type StageCategory = 'preposition' | 'article' | 'noun'

export interface Question {
  /** 空欄を ___ で表した英文 */
  sentence: string
  /** 正解（無冠詞などは空文字列） */
  answer: string
  /** 別解 */
  accept?: string[]
  /** 和訳（解答前から表示する） */
  translation: string
  /** 解説。なぜその語を使うのかがイメージで分かるように書く（解答後に表示） */
  explanation: string
}

export interface Stage {
  id: string
  title: string
  category: StageCategory
  description: string
  questions: Question[]
}

export interface StageRecord {
  correct: number
  total: number
  /** 0-100 の整数 (%) */
  accuracy: number
  /** ISO 8601 */
  playedAt: string
}

export type Records = Record<string, StageRecord>
