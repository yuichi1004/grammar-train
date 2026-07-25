import type { Records } from '../types'

export const STORAGE_KEY = 'grammar-train:records:v1'

export function loadRecords(): Records {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    return parsed as Records
  } catch {
    return {}
  }
}

export function saveRecord(
  stageId: string,
  result: { correct: number; total: number },
): void {
  const records = loadRecords()
  records[stageId] = {
    correct: result.correct,
    total: result.total,
    accuracy: Math.round((result.correct / result.total) * 100),
    playedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}
