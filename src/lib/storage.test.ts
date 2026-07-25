import { describe, it, expect, beforeEach } from 'vitest'
import { loadRecords, saveRecord, STORAGE_KEY } from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('記録がなければ空オブジェクトを返す', () => {
    expect(loadRecords()).toEqual({})
  })

  it('保存した記録を読み出せる', () => {
    saveRecord('prepositions-1', { correct: 24, total: 30 })
    const records = loadRecords()
    expect(records['prepositions-1']).toMatchObject({
      correct: 24,
      total: 30,
      accuracy: 80,
    })
    expect(records['prepositions-1'].playedAt).toBeTruthy()
  })

  it('同じステージは上書きされる', () => {
    saveRecord('prepositions-1', { correct: 10, total: 30 })
    saveRecord('prepositions-1', { correct: 30, total: 30 })
    expect(loadRecords()['prepositions-1'].accuracy).toBe(100)
  })

  it('別ステージの記録は保持される', () => {
    saveRecord('a', { correct: 15, total: 30 })
    saveRecord('b', { correct: 30, total: 30 })
    expect(Object.keys(loadRecords())).toHaveLength(2)
  })

  it('正答率は四捨五入した整数 (%)', () => {
    saveRecord('a', { correct: 20, total: 30 })
    expect(loadRecords()['a'].accuracy).toBe(67)
  })

  it('壊れた JSON は空として扱う', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadRecords()).toEqual({})
  })

  it('オブジェクトでない JSON も空として扱う', () => {
    localStorage.setItem(STORAGE_KEY, '"hello"')
    expect(loadRecords()).toEqual({})
  })
})
