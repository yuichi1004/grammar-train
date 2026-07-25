import { describe, it, expect } from 'vitest'
import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('元の配列を書き換えない', () => {
    const input = ['a', 'b', 'c']
    shuffle(input)
    expect(input).toEqual(['a', 'b', 'c'])
  })

  it('同じ長さの配列を返す', () => {
    expect(shuffle([1, 2, 3, 4, 5])).toHaveLength(5)
  })

  it('元の要素と同じ集合を持つ（増減・重複がない）', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const result = shuffle(input)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('空配列は空配列を返す', () => {
    expect(shuffle([])).toEqual([])
  })

  it('要素1つの配列はそのまま返す', () => {
    expect(shuffle(['only'])).toEqual(['only'])
  })

  // random を注入できるようにして、アルゴリズムの挙動を決定的に検証する（Fisher-Yates）
  it('random を注入すると決定的な並びになる', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], () => 0)).toEqual([
      'b',
      'c',
      'd',
      'a',
    ])
  })

  it('random の既定値は Math.random', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) {
      seen.add(shuffle([1, 2, 3, 4, 5, 6]).join(','))
    }
    // 30回シャッフルして常に同じ並びなら、ランダム化されていない
    expect(seen.size).toBeGreaterThan(1)
  })
})
