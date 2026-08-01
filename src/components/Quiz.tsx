import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Question, Stage } from '../types'
import { judge } from '../lib/judge'
import { shuffle } from '../lib/shuffle'

interface QuizProps {
  stage: Stage
  /**
   * 指定すると復習モードになり、この問題だけを出題する。
   * 空配列を渡すと出題できずに落ちるので、呼び出し側で 0 問のときは復習に入らないこと。
   */
  reviewQuestions?: Question[]
  onFinish: (correct: number, wrong: Question[]) => void
  onQuit: () => void
}

/** 1 問ごとの判定。正解数と不正解の一覧をここから導くので、両者が食い違わない */
interface Verdict {
  question: Question
  ok: boolean
}

export function Quiz({
  stage,
  reviewQuestions,
  onFinish,
  onQuit,
}: QuizProps) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [verdicts, setVerdicts] = useState<Verdict[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const isReview = reviewQuestions !== undefined
  // 出題順をマウント時に1回だけシャッフルする。似た内容が連続で出題される単調さを
  // 崩し、順番の暗記では解けないようにするため。
  const [questions] = useState(() => shuffle(reviewQuestions ?? stage.questions))

  const question = questions[index]
  const total = questions.length
  // 今の問題まで判定が積まれていれば解答済み
  const answered = verdicts.length > index
  const isCorrect = answered ? verdicts[index].ok : null
  const correctCount = verdicts.filter((v) => v.ok).length
  const [before, after] = question.sentence.split('___')
  // 無冠詞・前置詞なしを問うステージかどうか。カテゴリではなくデータから決めるので、
  // 冠詞以外（ビジネス場面など）でも空欄解答を出せる。
  // 出題中の配列ではなく stage 全体で判定すること。復習では出題が部分集合になるため、
  // questions から判定すると「答えが空欄の1問だけの復習」で答えそのものが漏れる。
  const hasBlankAnswer = stage.questions.some((q) => q.answer === '')

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!answered) {
      setVerdicts((vs) => [...vs, { question, ok: judge(question, input) }])
      return
    }
    if (index + 1 >= total) {
      // 判定と「次へ」は別のイベントなので、ここでは最後の問題の判定も反映済み
      onFinish(
        correctCount,
        verdicts.filter((v) => !v.ok).map((v) => v.question),
      )
      return
    }
    setIndex((i) => i + 1)
    setInput('')
  }

  return (
    <div className="quiz">
      <header className="quiz-header">
        <button type="button" className="quit-button" onClick={onQuit}>
          やめる
        </button>
        <span className="progress">
          {isReview && <span className="review-badge">復習</span>}
          {index + 1} / {total}
        </span>
        <span className="score">正解 {correctCount}</span>
      </header>

      <p className="sentence" lang="en">
        {before}
        <span className="blank">{answered ? question.answer || '∅' : '___'}</span>
        {after}
      </p>

      <p className="translation">{question.translation}</p>

      {!answered && stage.hint && <p className="hint">{stage.hint}</p>}

      {hasBlankAnswer && !answered && (
        <p className="hint">
          何も入らない（無冠詞・前置詞なし）ときは空欄のまま「答える」を押してください
        </p>
      )}

      <form onSubmit={handleSubmit} className="answer-form">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          readOnly={answered}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="答えを入力"
          className={
            answered ? (isCorrect ? 'input-correct' : 'input-wrong') : ''
          }
        />
        {!answered ? (
          <button type="submit" className="primary-button">
            答える
          </button>
        ) : (
          <button type="submit" className="primary-button">
            次へ
          </button>
        )}
      </form>

      {answered && (
        <div
          className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}
          role="status"
        >
          <p className="verdict">{isCorrect ? '正解！' : '不正解'}</p>
          {!isCorrect && (
            <p className="correct-answer">
              正解: {question.answer === '' ? '（何も入らない）' : question.answer}
            </p>
          )}
          <p className="explanation">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
