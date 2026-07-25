import type { Question } from '../types'

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** 入力が問題の正解（または別解）に一致するか判定する */
export function judge(question: Question, input: string): boolean {
  const normalized = normalize(input)
  const candidates = [question.answer, ...(question.accept ?? [])]
  return candidates.some((answer) => normalize(answer) === normalized)
}
