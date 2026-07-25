/**
 * iOS のホーム画面アプリは、バックグラウンド復帰やタブの再訪だけでは
 * Service Worker の更新チェックが走らないことがある。
 * アプリが前面に来るたびに明示的に registration.update() を呼び、
 * 更新の見落としを防ぐ。
 */
export function scheduleUpdateChecks(
  registration: ServiceWorkerRegistration,
  target: Pick<typeof window, 'addEventListener'> = window,
  doc: Pick<typeof document, 'addEventListener' | 'visibilityState'> = document,
): void {
  const check = () => {
    registration.update().catch(() => {
      // オフラインなどで失敗しても、次のチェック機会に任せる
    })
  }
  check()
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') check()
  })
  target.addEventListener('pageshow', check)
}
