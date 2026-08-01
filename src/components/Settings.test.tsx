import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'

describe('Settings', () => {
  it('見出しが表示される', () => {
    render(
      <Settings
        settings={{ reviewEnabled: true }}
        onChange={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: '設定' })).toBeInTheDocument()
  })

  it('復習が有効ならチェックが入っている', () => {
    render(
      <Settings
        settings={{ reviewEnabled: true }}
        onChange={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByRole('checkbox', { name: /復習/ })).toBeChecked()
  })

  it('復習が無効ならチェックが外れている', () => {
    render(
      <Settings
        settings={{ reviewEnabled: false }}
        onChange={vi.fn()}
        onBack={vi.fn()}
      />,
    )
    expect(screen.getByRole('checkbox', { name: /復習/ })).not.toBeChecked()
  })

  it('チェックを外すと onChange に false が渡る', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Settings
        settings={{ reviewEnabled: true }}
        onChange={onChange}
        onBack={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: /復習/ }))
    expect(onChange).toHaveBeenCalledWith({ reviewEnabled: false })
  })

  it('チェックを入れると onChange に true が渡る', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Settings
        settings={{ reviewEnabled: false }}
        onChange={onChange}
        onBack={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: /復習/ }))
    expect(onChange).toHaveBeenCalledWith({ reviewEnabled: true })
  })

  it('「戻る」で onBack が呼ばれる', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(
      <Settings
        settings={{ reviewEnabled: true }}
        onChange={vi.fn()}
        onBack={onBack}
      />,
    )
    await user.click(screen.getByRole('button', { name: '戻る' }))
    expect(onBack).toHaveBeenCalled()
  })
})
