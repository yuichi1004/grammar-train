import type { Settings } from '../types'

export const SETTINGS_KEY = 'grammar-train:settings:v1'

export const DEFAULT_SETTINGS: Settings = {
  reviewEnabled: true,
}

/**
 * 設定を読み出す。壊れていれば既定値に落とす。
 * spread で混ぜるだけだと "false" のような文字列がそのまま入ってしまうので、
 * キーごとに typeof を確かめる。
 */
export function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (raw === null) return { ...DEFAULT_SETTINGS }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_SETTINGS }
    }
    const value = parsed as Record<string, unknown>
    return {
      reviewEnabled:
        typeof value.reviewEnabled === 'boolean'
          ? value.reviewEnabled
          : DEFAULT_SETTINGS.reviewEnabled,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
