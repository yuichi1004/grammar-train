import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Stage } from '../types'
import { judge } from '../lib/judge'

interface QuizProps {
  stage: Stage
  onFinish: (correct: number) => void
  onQuit: () => void
}

export function Quiz({ stage, onFinish, onQuit }: QuizProps) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const question = stage.questions[index]
  const total = stage.questions.length
  const answered = isCorrect !== null
  const [before, after] = question.sentence.split('___')

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!answered) {
      const ok = judge(question, input)
      setIsCorrect(ok)
      if (ok) setCorrectCount((count) => count + 1)
      return
    }
    if (index + 1 >= total) {
      onFinish(correctCount)
      return
    }
    setIndex((i) => i + 1)
    setInput('')
    setIsCorrect(null)
  }

  return (
    <div className="quiz">
      <header className="quiz-header">
        <button type="button" className="quit-button" onClick={onQuit}>
          やめる
        </button>
        <span className="progress">
          {index + 1} / {total}
        </span>
        <span className="score">正解 {correctCount}</span>
      </header>

      <p className="sentence" lang="en">
        {before}
        <span className="blank">{answered ? question.answer || '∅' : '___'}</span>
        {after}
      </p>

      {stage.category === 'article' && !answered && (
        <p className="hint">無冠詞のときは空欄のまま「答える」を押してください</p>
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
              正解: {question.answer === '' ? '（無冠詞）' : question.answer}
            </p>
          )}
          <p className="translation">{question.translation}</p>
          <p className="explanation">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
