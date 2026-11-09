import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { ScanLink } from './ScanLink'
import { checkScan } from './scan-health'
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

it('consulta apenas por clique, sem credenciais, e não interpreta erro HTTP como rede indisponível', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 200 })).mockResolvedValueOnce(new Response(null, { status: 405 }))
  vi.stubGlobal('fetch', request)
  const user = userEvent.setup()
  render(<ScanLink key="first" url="https://scan.example/obra" title="Obra" />)
  expect(request).not.toHaveBeenCalled()
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
  await user.click(screen.getByRole('button', { name: 'Verificar link de Obra' }))
  expect(await screen.findByText('Link respondeu (HTTP 200)')).toBeVisible()
  expect(request).toHaveBeenCalledWith('https://scan.example/obra', expect.objectContaining({ method: 'HEAD', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' }))
  await user.click(screen.getByRole('button', { name: 'Verificar link de Obra' }))
  expect(await screen.findByText('Resposta HTTP 405; confira o link')).toBeVisible()
  expect(request).toHaveBeenCalledTimes(2)
})
it('trata CORS/rede e resposta opaca como inconclusivos', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({ type: 'opaque', status: 0 }))
  const user = userEvent.setup()
  render(<ScanLink url="https://scan.example" title="Obra" />)
  await user.click(screen.getByRole('button'))
  expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível verificar')
  expect(await checkScan('https://scan.example', new AbortController().signal)).toEqual({ kind: 'unknown' })
})
it('encerra por timeout, cancela ao trocar o link e não mostra resultado antigo', async () => {
  vi.useFakeTimers()
  const request = vi.fn(() => new Promise<Response>(() => {}))
  vi.stubGlobal('fetch', request)
  const view = render(<ScanLink key="first" url="https://scan.example/first" title="Obra" />)
  fireEvent.click(screen.getByRole('button'))
  await act(() => vi.advanceTimersByTimeAsync(8000))
  expect(screen.getByRole('status')).toHaveTextContent('Não foi possível verificar')
  expect(request.mock.calls[0]).toBeDefined()
  const firstSignal = (request.mock.calls as unknown as [string, RequestInit][])[0][1].signal!
  expect(firstSignal.aborted).toBe(true)
  fireEvent.click(screen.getByRole('button'))
  const nextSignal = (request.mock.calls as unknown as [string, RequestInit][])[1][1].signal!
  view.rerender(<ScanLink key="second" url="https://scan.example/second" title="Obra" />)
  expect(nextSignal.aborted).toBe(true)
  expect(screen.getByRole('status')).toHaveTextContent('Link não verificado')
  expect(vi.getTimerCount()).toBe(0)
})
