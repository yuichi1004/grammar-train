import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from './settings'

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('未設定なら復習は有効', () => {
    expect(loadSettings()).toEqual({ reviewEnabled: true })
  })

  it('保存した設定を読み出せる', () => {
    saveSettings({ reviewEnabled: false })
    expect(loadSettings().reviewEnabled).toBe(false)
  })

  it('壊れた JSON は既定値として扱う', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('オブジェクトでない JSON も既定値として扱う', () => {
    localStorage.setItem(SETTINGS_KEY, '"hello"')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('配列も既定値として扱う', () => {
    localStorage.setItem(SETTINGS_KEY, '[]')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('null も既定値として扱う', () => {
    localStorage.setItem(SETTINGS_KEY, 'null')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  // spread で混ぜるだけだと "false" のような文字列が truthy のまま通ってしまう
  it('boolean でない値は既定値で置き換える', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ reviewEnabled: 'false' }))
    expect(loadSettings().reviewEnabled).toBe(true)
  })

  it('キーが欠けていても既定値で補う', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({}))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('未知のキーは無視される', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ reviewEnabled: false, unknown: 123 }),
    )
    expect(loadSettings()).toEqual({ reviewEnabled: false })
  })

  it('既定値は書き換えられない', () => {
    saveSettings({ reviewEnabled: false })
    loadSettings()
    expect(DEFAULT_SETTINGS.reviewEnabled).toBe(true)
  })
})
