import type { Records, Stage, StageCategory } from '../types'

const CATEGORY_LABELS: Record<StageCategory, string> = {
  preposition: '前置詞',
  article: '冠詞',
  noun: '名詞',
}

interface StageSelectProps {
  stages: Stage[]
  records: Records
  onSelect: (stage: Stage) => void
  onShowHistory: () => void
}

export function StageSelect({
  stages,
  records,
  onSelect,
  onShowHistory,
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
      </nav>
      <ul className="stage-list">
        {stages.map((stage) => {
          const record = records[stage.id]
          return (
            <li key={stage.id}>
              <button
                type="button"
                className="stage-card"
                onClick={() => onSelect(stage)}
              >
                <span className="stage-category">
                  {CATEGORY_LABELS[stage.category]}
                </span>
                <span className="stage-title">{stage.title}</span>
                <span className="stage-description">{stage.description}</span>
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
    </div>
  )
}
