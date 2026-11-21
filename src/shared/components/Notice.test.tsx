import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Notice } from './Notice'
import { driveNotice } from './drive-notice'
import type { State } from '../../integrations/google-drive/session'

afterEach(() => { cleanup(); vi.useRealTimers() })
it('remove o sucesso após três segundos sem reiniciar por renderizações alheias', () => {
  vi.useFakeTimers()
  const event = {}
  const { rerender } = render(<Notice tone="success" message="Sincronizado" eventKey={event} />)
  act(() => vi.advanceTimersByTime(2000))
  rerender(<Notice tone="success" message="Sincronizado" eventKey={event} />)
  act(() => vi.advanceTimersByTime(999))
  expect(screen.getByRole('status')).toHaveTextContent('Sincronizado')
  act(() => vi.advanceTimersByTime(1))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  rerender(<Notice tone="success" message="Sincronizado" eventKey={{}} />)
  expect(screen.getByRole('status')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(3000))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
it('mantém atenção visível e cancela o timer de um sucesso substituído', () => {
  vi.useFakeTimers()
  const { rerender } = render(<Notice tone="success" message="Conectado" eventKey="connected" />)
  act(() => vi.advanceTimersByTime(2000))
  rerender(<Notice tone="warning" message="Há pendências" eventKey="pending" />)
  act(() => vi.advanceTimersByTime(10_000))
  expect(screen.getByRole('status')).toHaveTextContent('Há pendências')
  rerender(<Notice tone="error" message="Falha de rede" eventKey="error" />)
  act(() => vi.advanceTimersByTime(10_000))
  expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede')
})
const ready: State = { phase: 'ready', message: 'Conectado', canEdit: true, canWrite: true, automatic: false, cached: true, syncPhase: 'idle', snapshot: null }
it('distingue sucesso, progresso, pendências e problemas sem promover erros a sucesso', () => {
  expect(driveNotice(ready)?.tone).toBe('success')
  expect(driveNotice({ ...ready, phase: 'saving' })?.tone).toBe('info')
  expect(driveNotice({ ...ready, pending: { id: 'op', target: 'modules', key: 'mangas', value: {} } })?.tone).toBe('warning')
  expect(driveNotice({ ...ready, cacheError: 'Sem espaço' })?.tone).toBe('warning')
  expect(driveNotice({ ...ready, syncPhase: 'conflict' })?.tone).toBe('error')
  expect(driveNotice({ ...ready, phase: 'error' })?.tone).toBe('error')
  expect(driveNotice({ ...ready, message: 'A versão mais recente do Drive foi mantida.' })?.tone).toBe('warning')
  expect(driveNotice({ ...ready, phase: 'disconnected' })).toBeNull()
})
