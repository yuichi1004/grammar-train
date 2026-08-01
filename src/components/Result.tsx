import type { Stage } from '../types'

interface ResultProps {
  stage: Stage
  correct: number
  total: number
  /**
   * 間違えた問題の復習を始める。
   * 設定がオフ・間違いが 0 問のときは undefined になり、ボタンを出さない。
   */
  onReview?: () => void
  /** 直近の復習の成績。表示専用で、正答率にも記録にも影響しない */
  reviewResult?: { correct: number; total: number }
  onRetry: () => void
  onBack: () => void
}

export function Result({
  stage,
  correct,
  total,
  onReview,
  reviewResult,
  onRetry,
  onBack,
}: ResultProps) {
  const accuracy = Math.round((correct / total) * 100)
  return (
    <div className="result">
      <h1>ステージ完了</h1>
      <p className="result-stage-title">{stage.title}</p>
      <p className="accuracy">{accuracy}%</p>
      <p className="score-detail">
        {correct} / {total}
      </p>
      {/*
        復習の成績は正答率とは別物。但し書きまで含めて 1 つの要素にしておく
        （"2 / 2" だけの要素を作ると .score-detail と区別がつかなくなる）。
      */}
      {reviewResult && (
        <p className="review-result">
          復習 {reviewResult.correct} / {reviewResult.total}（記録には含みません）
        </p>
      )}
      <div className="result-actions">
        {onReview && (
          <button type="button" className="primary-button" onClick={onReview}>
            間違えた問題を復習
          </button>
        )}
        <button type="button" className="secondary-button" onClick={onRetry}>
          もう一度
        </button>
        <button type="button" className="secondary-button" onClick={onBack}>
          ステージ選択へ
        </button>
      </div>
    </div>
  )
}
