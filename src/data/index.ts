import { loadStages, sortStages } from '../lib/stages'
import type { Stage } from '../types'
import prepositions1 from './stages/prepositions-1.json'
import prepositions2 from './stages/prepositions-2.json'
import prepositionsAbstract from './stages/prepositions-abstract.json'
import prepositionsVerbs from './stages/prepositions-verbs.json'
import prepositionsAdjNoun from './stages/prepositions-adj-noun.json'
import prepositionsContrast from './stages/prepositions-contrast.json'
import articles1 from './stages/articles-1.json'
import articles2 from './stages/articles-2.json'
import nouns1 from './stages/nouns-1.json'
import nouns2 from './stages/nouns-2.json'

/**
 * 未検証のステージ JSON。新しいステージを追加するときはここに 1 行足すだけでよい。
 * 並び順は JSON の order で決まるので、この配列の順番は気にしなくてよい。
 * テスト（data/index.test.ts）がこの配列を厳格に検証する。
 */
export const stageSources: unknown[] = [
  prepositions1,
  prepositions2,
  prepositionsAbstract,
  prepositionsVerbs,
  prepositionsAdjNoun,
  prepositionsContrast,
  articles1,
  articles2,
  nouns1,
  nouns2,
]

/**
 * 表示に使うステージ。
 * 壊れたステージは警告して除外し、残りは遊べるようにする（1 個のタイポで全画面を落とさない）。
 * 不備は CI のテストで確実に検出する。
 */
export const stages: Stage[] = sortStages(loadStages(stageSources))
