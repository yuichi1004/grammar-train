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
  /**
   * localStorage に保存する記録の主キー。
   * 一度公開した id は変えないこと（変えると前回の正答率が別ステージに付く / 消える）。
   * 表示順は order で決まるので、id に連番を含める必要はない。
   */
  id: string
  /** 表示順。小さいほど先。10, 20, 30... と間隔をあけて振り、間に挿すときは 15 を使う */
  order?: number
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

/** 日付キー(YYYY-MM-DD、ローカル日付) → その日にクリアしたステージ数 */
export type StudyHistory = Record<string, number>
