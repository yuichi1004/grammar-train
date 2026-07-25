import { describe, it, expect, beforeEach } from 'vitest'
import { loadHistory, recordStudy, toDateKey, HISTORY_KEY } from './history'

describe('toDateKey', () => {
  it('YYYY-MM-DD 形式にする', () => {
    expect(toDateKey(new Date(2026, 6, 25))).toBe('2026-07-25')
  })

  it('1 桁の月日をゼロ埋めする', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  // toISOString() は UTC になるため、日本時間の朝 9 時前が前日扱いになってしまう。
  // ローカル日付で切ることを保証する。
  it('UTC ではなくローカル日付で切る', () => {
    const earlyMorning = new Date(2026, 6, 25, 1, 30)
    expect(toDateKey(earlyMorning)).toBe('2026-07-25')
  })
})

describe('history', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('記録がなければ空オブジェクトを返す', () => {
    expect(loadHistory()).toEqual({})
  })

  it('1 回クリアすると その日が 1 になる', () => {
    recordStudy(new Date(2026, 6, 25))
    expect(loadHistory()).toEqual({ '2026-07-25': 1 })
  })

  it('同じ日に 2 回クリアすると 2 になる', () => {
    recordStudy(new Date(2026, 6, 25))
    recordStudy(new Date(2026, 6, 25))
    expect(loadHistory()['2026-07-25']).toBe(2)
  })

  it('別の日は別のキーに積まれる', () => {
    recordStudy(new Date(2026, 6, 24))
    recordStudy(new Date(2026, 6, 25))
    expect(loadHistory()).toEqual({ '2026-07-24': 1, '2026-07-25': 1 })
  })

  it('引数を省略すると今日に記録される', () => {
    recordStudy()
    expect(loadHistory()[toDateKey(new Date())]).toBe(1)
  })

  it('壊れた JSON は空として扱う', () => {
    localStorage.setItem(HISTORY_KEY, '{not json')
    expect(loadHistory()).toEqual({})
  })

  it('オブジェクトでない JSON も空として扱う', () => {
    localStorage.setItem(HISTORY_KEY, '[1, 2]')
    expect(loadHistory()).toEqual({})
  })

  it('数値でない値は捨てる', () => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ '2026-07-25': 2, '2026-07-24': 'x' }),
    )
    expect(loadHistory()).toEqual({ '2026-07-25': 2 })
  })

  it('壊れた記録があっても加算できる', () => {
    localStorage.setItem(HISTORY_KEY, '{not json')
    recordStudy(new Date(2026, 6, 25))
    expect(loadHistory()).toEqual({ '2026-07-25': 1 })
  })
})
