import { useState } from 'react'
import type { Records, Stage, StudyHistory as StudyHistoryData } from './types'
import { stages as defaultStages } from './data'
import { loadRecords, saveRecord } from './lib/storage'
import { loadHistory, recordStudy } from './lib/history'
import { StageSelect } from './components/StageSelect'
import { Quiz } from './components/Quiz'
import { Result } from './components/Result'
import { StudyHistory } from './components/StudyHistory'

type View =
  | { screen: 'select' }
  | { screen: 'quiz'; stage: Stage }
  | { screen: 'result'; stage: Stage; correct: number }
  | { screen: 'history' }

interface AppProps {
  stages?: Stage[]
}

function App({ stages = defaultStages }: AppProps) {
  const [view, setView] = useState<View>({ screen: 'select' })
  const [records, setRecords] = useState<Records>(() => loadRecords())
  const [history, setHistory] = useState<StudyHistoryData>(() => loadHistory())

  function handleFinish(stage: Stage, correct: number) {
    saveRecord(stage.id, { correct, total: stage.questions.length })
    recordStudy()
    setRecords(loadRecords())
    setHistory(loadHistory())
    setView({ screen: 'result', stage, correct })
  }

  return (
    <main className="app">
      {view.screen === 'select' && (
        <StageSelect
          stages={stages}
          records={records}
          onSelect={(stage) => setView({ screen: 'quiz', stage })}
          onShowHistory={() => setView({ screen: 'history' })}
        />
      )}
      {view.screen === 'history' && (
        <StudyHistory
          history={history}
          onBack={() => setView({ screen: 'select' })}
        />
      )}
      {view.screen === 'quiz' && (
        <Quiz
          key={view.stage.id}
          stage={view.stage}
          onFinish={(correct) => handleFinish(view.stage, correct)}
          onQuit={() => setView({ screen: 'select' })}
        />
      )}
      {view.screen === 'result' && (
        <Result
          stage={view.stage}
          correct={view.correct}
          total={view.stage.questions.length}
          onRetry={() => setView({ screen: 'quiz', stage: view.stage })}
          onBack={() => setView({ screen: 'select' })}
        />
      )}
    </main>
  )
}

export default App
