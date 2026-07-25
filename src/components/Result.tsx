import type { Stage } from '../types'

interface ResultProps {
  stage: Stage
  correct: number
  total: number
  onRetry: () => void
  onBack: () => void
}

export function Result({ stage, correct, total, onRetry, onBack }: ResultProps) {
  const accuracy = Math.round((correct / total) * 100)
  return (
    <div className="result">
      <h1>ステージ完了</h1>
      <p className="result-stage-title">{stage.title}</p>
      <p className="accuracy">{accuracy}%</p>
      <p className="score-detail">
        {correct} / {total}
      </p>
      <div className="result-actions">
        <button type="button" className="primary-button" onClick={onRetry}>
          もう一度
        </button>
        <button type="button" className="secondary-button" onClick={onBack}>
          ステージ選択へ
        </button>
      </div>
    </div>
  )
}
