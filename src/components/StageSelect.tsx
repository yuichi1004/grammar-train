import type {
  Records,
  Stage,
  StageCategory,
  StudyHistory,
} from '../types'
import { RecentActivity } from './RecentActivity'

const CATEGORY_LABELS: Record<StageCategory, string> = {
  preposition: '前置詞',
  article: '冠詞',
  noun: '名詞',
  tense: '時制',
  scene: '場面',
}

/** 見出しを出す順。ここに載っていないカテゴリのステージも末尾のグループに出す */
const CATEGORY_ORDER: StageCategory[] = [
  'preposition',
  'article',
  'noun',
  'tense',
  'scene',
]

/**
 * カテゴリごとにステージをまとめる。グループ内の並びは渡された順（= order 昇順）のまま。
 * order の値そのものには依存しないので、後から order を振り直しても表示は壊れない。
 */
function groupByCategory(stages: Stage[]): [StageCategory, Stage[]][] {
  const known = CATEGORY_ORDER.map(
    (category): [StageCategory, Stage[]] => [
      category,
      stages.filter((s) => s.category === category),
    ],
  )
  const unknown = stages.filter((s) => !CATEGORY_ORDER.includes(s.category))
  const rest: [StageCategory, Stage[]][] = unknown.length
    ? [[unknown[0].category, unknown]]
    : []
  return [...known, ...rest].filter(([, group]) => group.length > 0)
}

interface StageSelectProps {
  stages: Stage[]
  records: Records
  history: StudyHistory
  onSelect: (stage: Stage) => void
  onShowHistory: () => void
  onShowSettings: () => void
  /** テストから固定日を注入できるようにしている */
  today?: Date
}

export function StageSelect({
  stages,
  records,
  history,
  onSelect,
  onShowHistory,
  onShowSettings,
  today,
}: StageSelectProps) {
  return (
    <div className="stage-select">
      <h1>Grammar Train</h1>
      <p className="tagline">前置詞・冠詞・名詞をタイピングで鍛える</p>
      <nav className="top-menu">
        <button
          type="button"
          className="secondary-button"
          onClick={onShowHistory}
        >
          学習記録
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onShowSettings}
        >
          設定
        </button>
      </nav>
      <RecentActivity history={history} today={today} />
      {groupByCategory(stages).map(([category, group]) => (
        <section key={category} className="stage-group">
          <h2 className="category-heading">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <ul className="stage-list">
            {group.map((stage) => {
              const record = records[stage.id]
              return (
                <li key={stage.id}>
                  <button
                    type="button"
                    className="stage-card"
                    onClick={() => onSelect(stage)}
                  >
                    <span className="stage-title">{stage.title}</span>
                    <span className="stage-description">
                      {stage.description}
                    </span>
                    <span
                      className={`stage-record ${record ? 'played' : 'unplayed'}`}
                    >
                      {record ? `前回 ${record.accuracy}%` : '未挑戦'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
