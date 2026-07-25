import type { Question, Stage, StageCategory } from '../types'

export const QUESTIONS_PER_STAGE = 30

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
    stage.questions.length !== QUESTIONS_PER_STAGE
  ) {
    throw new Error(
      `stage "${stage.id}": must have exactly ${QUESTIONS_PER_STAGE} questions`,
    )
  }
  stage.questions.forEach((q, i) => validateQuestion(q, stage.id as string, i))
  return stage as unknown as Stage
}

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
