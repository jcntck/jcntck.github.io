import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ConnectionPage } from './ConnectionPage'
import { CloudSession } from '../../integrations/google-drive/session'
import { applyOperation, type Snapshot } from '../../shared/storage/library'
import { emptyEnvelope } from '../../shared/storage/library'
import { DRIVE_SCOPE } from '../../integrations/google-drive/drive'
it('conecta, grava e relê o mesmo identificador em nova leitura remota', async () => {
  let remote: Snapshot | null = null
  const load = vi.fn(async () => structuredClone(remote))
  const session = new CloudSession(() => ({ account: async () => ({ id: 'stable-A', name: 'Conta de teste' }), load, save: async (base, op) => {
    remote = { fileId: 'file', document: applyOperation(base?.document ?? emptyEnvelope(), op) }
    return structuredClone(remote)
  } }))
  window.google = { accounts: { oauth2: {
    initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: 'memory-only', expires_in: 3600, scope: DRIVE_SCOPE }) }), hasGrantedAllScopes: () => true,
  } } }
  const user = userEvent.setup()
  render(<ConnectionPage controller={session} clientId="public-id" />)
  await user.click(await screen.findByRole('button', { name: 'Conectar Google Drive' }))
  expect(screen.queryByRole('link', { name: /Abrir arquivo no Google Drive/ })).not.toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: 'Gravar amostra' }))
  expect(await screen.findByText('Gravação confirmada por releitura do Drive.')).toBeVisible()
  expect(screen.getByRole('link', { name: /Abrir arquivo no Google Drive/ })).toHaveAttribute('href', 'https://drive.google.com/file/d/file/view')
  const text = screen.getByRole('heading', { name: 'Amostra retornada pelo Drive' }).parentElement!.textContent
  const calls = load.mock.calls.length
  await user.click(screen.getByRole('button', { name: 'Reler do Drive' }))
  expect(load.mock.calls.length).toBe(calls + 1)
  expect(screen.getByRole('heading', { name: 'Amostra retornada pelo Drive' }).parentElement!.textContent).toBe(text)
  expect(document.body.textContent).not.toContain('memory-only')
  expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0)
  await user.click(screen.getByRole('button', { name: 'Desconectar' }))
  expect(screen.queryByText('Conta: Conta de teste')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Abrir arquivo no Google Drive/ })).not.toBeInTheDocument()
  delete window.google
})
