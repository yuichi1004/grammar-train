import type { StudyHistory } from '../types'

export const HISTORY_KEY = 'grammar-train:history:v1'

/**
 * ローカル日付を YYYY-MM-DD にする。
 * toISOString() は UTC になり、日本時間の朝 9 時前が前日扱いになるため使わない。
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function loadHistory(): StudyHistory {
  const raw = localStorage.getItem(HISTORY_KEY)
  if (raw === null) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    const history: StudyHistory = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        history[key] = value
      }
    }
    return history
  } catch {
    return {}
  }
}

/** その日のクリア数を 1 増やす */
export function recordStudy(date: Date = new Date()): void {
  const history = loadHistory()
  const key = toDateKey(date)
  history[key] = (history[key] ?? 0) + 1
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}
