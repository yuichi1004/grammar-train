import type { Question, Stage, StageCategory } from '../types'

/** ステージは最低 1 問。問題数は上限を設けない（30 問が標準だが腕試し用の短いステージも作れる） */
export const MIN_QUESTIONS = 1

/** order 未指定のステージを末尾に回すための番兵 */
const ORDER_LAST = Number.MAX_SAFE_INTEGER

const CATEGORIES: StageCategory[] = ['preposition', 'article', 'noun']

function validateQuestion(value: unknown, stageId: string, index: number): Question {
  const label = `stage "${stageId}" questions[${index}]`
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${label}: not an object`)
  }
  const q = value as Record<string, unknown>
  if (typeof q.sentence !== 'string' || !q.sentence.includes('___')) {
    throw new Error(`${label}: sentence must contain a blank "___"`)
  }
  if (typeof q.answer !== 'string') {
    throw new Error(`${label}: answer must be a string`)
  }
  if (q.accept !== undefined && !Array.isArray(q.accept)) {
    throw new Error(`${label}: accept must be an array`)
  }
  if (typeof q.translation !== 'string') {
    throw new Error(`${label}: translation must be a string`)
  }
  if (typeof q.explanation !== 'string') {
    throw new Error(`${label}: explanation must be a string`)
  }
  return q as unknown as Question
}

export function validateStage(value: unknown): Stage {
  if (typeof value !== 'object' || value === null) {
    throw new Error('stage: not an object')
  }
  const stage = value as Record<string, unknown>
  if (typeof stage.id !== 'string' || stage.id === '') {
    throw new Error('stage: id is required')
  }
  if (
    stage.order !== undefined &&
    (typeof stage.order !== 'number' || !Number.isFinite(stage.order))
  ) {
    throw new Error(`stage "${stage.id}": order must be a finite number`)
  }
  if (typeof stage.title !== 'string' || stage.title === '') {
    throw new Error(`stage "${stage.id}": title is required`)
  }
  if (!CATEGORIES.includes(stage.category as StageCategory)) {
    throw new Error(
      `stage "${stage.id}": category must be one of ${CATEGORIES.join(', ')}`,
    )
  }
  if (typeof stage.description !== 'string') {
    throw new Error(`stage "${stage.id}": description is required`)
  }
  if (
    !Array.isArray(stage.questions) ||
    stage.questions.length < MIN_QUESTIONS
  ) {
    throw new Error(
      `stage "${stage.id}": must have at least ${MIN_QUESTIONS} question(s)`,
    )
  }
  stage.questions.forEach((q, i) => validateQuestion(q, stage.id as string, i))
  return stage as unknown as Stage
}

/**
 * 厳格版。1 つでも不備があれば throw する。
 * テスト（CI）でステージ JSON をまとめて検証するために使う。
 */
export function validateStages(values: unknown[]): Stage[] {
  const stages = values.map(validateStage)
  const seen = new Set<string>()
  for (const stage of stages) {
    if (seen.has(stage.id)) {
      throw new Error(`duplicate stage id: "${stage.id}"`)
    }
    seen.add(stage.id)
  }
  return stages
}

/**
 * 寛容版。壊れたステージだけ警告して除外し、残りを返す。
 * ステージが増えるほど 1 個のタイポで全画面が落ちるリスクが上がるため、本番ではこちらを使う。
 * 不備は CI のテスト（validateStages）で確実に検出する。
 */
export function loadStages(values: unknown[]): Stage[] {
  const stages: Stage[] = []
  const seen = new Set<string>()
  for (const value of values) {
    let stage: Stage
    try {
      stage = validateStage(value)
    } catch (e) {
      console.error('[grammar-train] 不正なステージを読み込めなかったため除外します:', e)
      continue
    }
    if (seen.has(stage.id)) {
      console.error(
        `[grammar-train] ステージ id が重複しています。先に読み込んだ方を使います: "${stage.id}"`,
      )
      continue
    }
    seen.add(stage.id)
    stages.push(stage)
  }
  return stages
}

/**
 * order の昇順に並べる。order 未指定は末尾。
 * Array.prototype.sort は安定なので、order が同値のものは元の並び順を保つ。
 */
export function sortStages(stages: Stage[]): Stage[] {
  return [...stages].sort((a, b) => (a.order ?? ORDER_LAST) - (b.order ?? ORDER_LAST))
}
