import type { Settings as SettingsData } from '../types'

interface SettingsProps {
  settings: SettingsData
  onChange: (settings: SettingsData) => void
  onBack: () => void
}

export function Settings({ settings, onChange, onBack }: SettingsProps) {
  return (
    <div className="settings">
      <header className="history-header">
        <button type="button" className="secondary-button" onClick={onBack}>
          戻る
        </button>
        <h1>設定</h1>
      </header>

      <ul className="settings-list">
        <li>
          {/* input を label で包むと、id と htmlFor なしでアクセシブル名がつく */}
          <label className="settings-row">
            <input
              type="checkbox"
              checked={settings.reviewEnabled}
              onChange={(e) =>
                onChange({ ...settings, reviewEnabled: e.target.checked })
              }
            />
            <span className="settings-label">
              <span className="settings-title">復習セッション</span>
              <span className="settings-description">
                ステージ完了後に、間違えた問題だけを解き直せるようにします。
                復習の正解は正答率にも学習記録にも含まれません。
              </span>
            </span>
          </label>
        </li>
      </ul>
    </div>
  )
}
