import type { Stage } from './types'

/** テスト用の 3 問だけの小さなステージ */
export function makeTestStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'test-stage',
    title: 'テストステージ',
    category: 'preposition',
    description: 'テスト用のステージ',
    questions: [
      {
        sentence: 'I arrived ___ the station.',
        answer: 'at',
        translation: '駅に着いた。',
        explanation: '地点には at。',
      },
      {
        sentence: 'She lives ___ Tokyo.',
        answer: 'in',
        translation: '彼女は東京に住んでいる。',
        explanation: '都市には in。',
      },
      {
        sentence: 'The keys are ___ the table.',
        answer: 'on',
        translation: '鍵はテーブルの上にある。',
        explanation: '面の上は on。',
      },
    ],
    ...overrides,
  }
}
