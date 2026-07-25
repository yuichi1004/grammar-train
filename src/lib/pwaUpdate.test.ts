import { describe, it, expect, vi } from 'vitest'
import { scheduleUpdateChecks } from './pwaUpdate'

type FakeWindow = Pick<typeof window, 'addEventListener'> & {
  fire: (type: string) => void
}

/** addEventListener を差し替え可能にした、テスト用の最小 EventTarget */
function fakeTarget(): FakeWindow {
  const listeners: Record<string, (() => void)[]> = {}
  return {
    addEventListener: vi.fn((type: string, listener: unknown) => {
      ;(listeners[type] ??= []).push(listener as () => void)
    }) as unknown as FakeWindow['addEventListener'],
    fire(type: string) {
      for (const listener of listeners[type] ?? []) listener()
    },
  }
}

function fakeRegistration() {
  return { update: vi.fn().mockResolvedValue(undefined) }
}

describe('scheduleUpdateChecks', () => {
  it('呼び出された直後に一度更新チェックする', () => {
    const registration = fakeRegistration()
    scheduleUpdateChecks(
      registration as unknown as ServiceWorkerRegistration,
      fakeTarget(),
      { ...fakeTarget(), visibilityState: 'visible' } as unknown as Document,
    )
    expect(registration.update).toHaveBeenCalledTimes(1)
  })

  it('アプリが前面に来たとき（visibilitychange で visible）に再チェックする', () => {
    const registration = fakeRegistration()
    const doc = { ...fakeTarget(), visibilityState: 'visible' }
    scheduleUpdateChecks(
      registration as unknown as ServiceWorkerRegistration,
      fakeTarget(),
      doc as unknown as Document,
    )
    doc.fire('visibilitychange')
    expect(registration.update).toHaveBeenCalledTimes(2)
  })

  it('バックグラウンドに回ったとき（visible でない）は再チェックしない', () => {
    const registration = fakeRegistration()
    const doc = { ...fakeTarget(), visibilityState: 'hidden' }
    scheduleUpdateChecks(
      registration as unknown as ServiceWorkerRegistration,
      fakeTarget(),
      doc as unknown as Document,
    )
    doc.fire('visibilitychange')
    // 起動直後の1回だけで、visibilitychange 分は増えない
    expect(registration.update).toHaveBeenCalledTimes(1)
  })

  it('pageshow（iOS の bfcache 復帰など）でも再チェックする', () => {
    const registration = fakeRegistration()
    const win = fakeTarget()
    scheduleUpdateChecks(
      registration as unknown as ServiceWorkerRegistration,
      win,
      { ...fakeTarget(), visibilityState: 'visible' } as unknown as Document,
    )
    win.fire('pageshow')
    expect(registration.update).toHaveBeenCalledTimes(2)
  })

  it('update() が失敗しても例外を投げない（オフライン時など）', () => {
    const registration = {
      update: vi.fn().mockRejectedValue(new Error('offline')),
    }
    expect(() =>
      scheduleUpdateChecks(
        registration as unknown as ServiceWorkerRegistration,
        fakeTarget(),
        { ...fakeTarget(), visibilityState: 'visible' } as unknown as Document,
      ),
    ).not.toThrow()
  })
})
