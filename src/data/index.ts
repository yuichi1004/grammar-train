import { validateStages } from '../lib/stages'
import type { Stage } from '../types'
import prepositions1 from './stages/prepositions-1.json'
import prepositions2 from './stages/prepositions-2.json'
import articles1 from './stages/articles-1.json'
import articles2 from './stages/articles-2.json'
import nouns1 from './stages/nouns-1.json'
import nouns2 from './stages/nouns-2.json'

// 新しいステージを追加する場合は JSON を import してこの配列に足す
export const stages: Stage[] = validateStages([
  prepositions1,
  prepositions2,
  articles1,
  articles2,
  nouns1,
  nouns2,
])
