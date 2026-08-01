import { useState } from 'react'
import type {
  Question,
  Records,
  Settings as SettingsData,
  Stage,
  StudyHistory as StudyHistoryData,
} from './types'
import { stages as defaultStages } from './data'
import { loadRecords, saveRecord } from './lib/storage'
import { loadHistory, recordStudy } from './lib/history'
import { loadSettings, saveSettings } from './lib/settings'
import { StageSelect } from './components/StageSelect'
import { Quiz } from './components/Quiz'
import { Result } from './components/Result'
import { StudyHistory } from './components/StudyHistory'
import { Settings } from './components/Settings'

/** 1 回のセッションの結果。結果画面と復習画面で共有する */
interface SessionResult {
  stage: Stage
  correct: number
  /** このセッションで間違えた問題。復習の出題元で、復習の結果では書き換えない */
  wrong: Question[]
  /** 直近の復習の成績。表示専用で、正答率にも記録にも影響しない */
  review?: { correct: number; total: number }
}

type View =
  | { screen: 'select' }
  | { screen: 'quiz'; stage: Stage }
  | { screen: 'result'; result: SessionResult }
  | { screen: 'review'; result: SessionResult }
  | { screen: 'history' }
  | { screen: 'settings' }

interface AppProps {
  stages?: Stage[]
}

function App({ stages = defaultStages }: AppProps) {
  const [view, setView] = useState<View>({ screen: 'select' })
  const [records, setRecords] = useState<Records>(() => loadRecords())
  const [history, setHistory] = useState<StudyHistoryData>(() => loadHistory())
  const [settings, setSettings] = useState<SettingsData>(() => loadSettings())

  function handleFinish(stage: Stage, correct: number, wrong: Question[]) {
    saveRecord(stage.id, { correct, total: stage.questions.length })
    recordStudy()
    setRecords(loadRecords())
    setHistory(loadHistory())
    // 毎回新しい SessionResult を作る。前の結果とマージすると、やり直したあとも
    // 前回の復習の成績が居座ってしまう
    setView({ screen: 'result', result: { stage, correct, wrong } })
  }

  /**
   * 復習の終了。saveRecord も recordStudy も呼ばない。
   * 「復習は正答率にも学習記録にも含めない」は、この関数を handleFinish と
   * 分けておくことで担保している。フラグで分岐させないこと。
   */
  function handleReviewFinish(result: SessionResult, correct: number) {
    setView({
      screen: 'result',
      result: { ...result, review: { correct, total: result.wrong.length } },
    })
  }

  function handleSettingsChange(next: SettingsData) {
    saveSettings(next)
    setSettings(next)
  }

  return (
    <main className="app">
      {view.screen === 'select' && (
        <StageSelect
          stages={stages}
          records={records}
          onSelect={(stage) => setView({ screen: 'quiz', stage })}
          onShowHistory={() => setView({ screen: 'history' })}
          onShowSettings={() => setView({ screen: 'settings' })}
        />
      )}
      {view.screen === 'history' && (
        <StudyHistory
          history={history}
          onBack={() => setView({ screen: 'select' })}
        />
      )}
      {view.screen === 'settings' && (
        <Settings
          settings={settings}
          onChange={handleSettingsChange}
          onBack={() => setView({ screen: 'select' })}
        />
      )}
      {view.screen === 'quiz' && (
        <Quiz
          key={view.stage.id}
          stage={view.stage}
          onFinish={(correct, wrong) => handleFinish(view.stage, correct, wrong)}
          onQuit={() => setView({ screen: 'select' })}
        />
      )}
      {/*
        復習用の Quiz は通常の Quiz と別の描画位置に置く。1 か所にまとめると
        同じスロット・同じ key になり、通常 → 復習の遷移で出題位置や判定が持ち越される。
      */}
      {view.screen === 'review' && (
        <Quiz
          stage={view.result.stage}
          reviewQuestions={view.result.wrong}
          onFinish={(correct) => handleReviewFinish(view.result, correct)}
          onQuit={() => setView({ screen: 'result', result: view.result })}
        />
      )}
      {view.screen === 'result' && (
        <Result
          stage={view.result.stage}
          correct={view.result.correct}
          total={view.result.stage.questions.length}
          reviewResult={view.result.review}
          onReview={
            settings.reviewEnabled && view.result.wrong.length > 0
              ? () => setView({ screen: 'review', result: view.result })
              : undefined
          }
          onRetry={() => setView({ screen: 'quiz', stage: view.result.stage })}
          onBack={() => setView({ screen: 'select' })}
        />
      )}
    </main>
  )
}

export default App
