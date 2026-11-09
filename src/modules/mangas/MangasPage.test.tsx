import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { CloudSession } from '../../integrations/google-drive/session'
import { Hub } from '../../shared/session/hub'
import { HubContext } from '../../shared/session/hooks'
import { LibraryError, applyOperation, emptyEnvelope, type Snapshot } from '../../shared/storage/library'
import { MangasPage } from './MangasPage'

afterEach(() => { delete window.google })
async function setup(remote: Snapshot | null = null, connected = true) {
  const save = vi.fn(async (base: Snapshot | null, op: Parameters<typeof applyOperation>[1]): Promise<Snapshot> => {
    remote = { fileId: 'test-file', document: applyOperation(base?.document ?? emptyEnvelope(), op) }
    return structuredClone(remote)
  })
  const cloud = new CloudSession(() => ({ account: async () => ({ id: 'A', name: 'Conta de teste' }), load: async () => structuredClone(remote), save }))
  const hub = new Hub({ configured: false, initialize: async () => false, observe: () => () => {}, login: async () => {}, logout: async () => {} }, cloud)
  vi.spyOn(hub.auth, 'isValid').mockReturnValue(true)
  window.google = { accounts: { oauth2: { initTokenClient: config => ({ requestAccessToken: () => config.callback({ access_token: 'test-memory', expires_in: 3600, scope: '' }) }), hasGrantedAllScopes: () => true } } }
  if (connected) await cloud.connect(async () => ({ access_token: 'test-memory', expires_in: 3600, scope: '' }))
  render(<HubContext.Provider value={hub}><MangasPage /></HubContext.Provider>)
  return { cloud, save, user: userEvent.setup(), remote: () => remote }
}
it('aguarda leitura válida e não apresenta biblioteca desconhecida como vazia', async () => {
  const { save } = await setup(null, false)
  expect(screen.getByRole('button', { name: 'Cadastrar mangá' })).toBeDisabled()
  expect(screen.getByText(/ainda não foram consultados/)).toBeVisible()
  expect(screen.queryByText(/Ainda não há mangás cadastrados/)).not.toBeInTheDocument()
  expect(save).not.toHaveBeenCalled()
})
it('valida, prepara sem escrever, preserva formulário na falha e confirma retry com UUID estável', async () => {
  const { cloud, save, user, remote } = await setup({ fileId: 'test-file', document: { ...emptyEnvelope(), diagnostics: { probe: 'keep' }, modules: { other: 'keep' } } })
  await user.click(screen.getByRole('button', { name: 'Cadastrar mangá' }))
  await user.click(screen.getByRole('button', { name: 'Preparar leitura' }))
  expect(screen.getByText('Informe o título.')).toBeVisible()
  expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true')
  expect(cloud.getSnapshot().pending).toBeUndefined()
  await user.type(screen.getByLabelText('Título'), 'One Piece')
  await user.type(screen.getByLabelText('Último capítulo lido'), 'Extra 1')
  await user.clear(screen.getByLabelText('Data da leitura'))
  await user.type(screen.getByLabelText('Data da leitura'), '2026-04-06')
  await user.click(screen.getByRole('button', { name: 'Preparar leitura' }))
  expect(screen.getByText('Pendente de sincronização')).toBeVisible()
  expect(save).not.toHaveBeenCalled()
  const operation = cloud.getSnapshot().pending!
  save.mockRejectedValueOnce(new LibraryError('network', 'Falha de rede simulada.'))
  await user.click(screen.getByRole('button', { name: 'Sincronizar' }))
  expect(await screen.findByText('Falha de rede simulada.')).toBeVisible()
  expect(screen.getByLabelText('Título')).toHaveValue('One Piece')
  expect(screen.getByLabelText('Data da leitura')).toHaveValue('2026-04-06')
  expect(screen.queryByText('Confirmado no Drive')).not.toBeInTheDocument()
  await act(() => cloud.connect(async () => ({ access_token: 'retry', expires_in: 3600, scope: '' })))
  await user.click(screen.getByRole('button', { name: 'Sincronizar' }))
  expect(await screen.findByText('Confirmado no Drive')).toBeVisible()
  expect(save.mock.calls[1][1].id).toBe(operation.id)
  expect(remote()?.document.diagnostics).toEqual({ probe: 'keep' })
  expect(remote()?.document.modules.other).toBe('keep')
  const id = (remote()!.document.modules.mangas as { items: { id: string }[] }).items[0].id
  await user.click(screen.getByRole('button', { name: 'Corrigir leitura de One Piece' }))
  await user.clear(screen.getByLabelText('Título')); await user.type(screen.getByLabelText('Título'), 'One Piece corrigido')
  await user.click(screen.getByRole('button', { name: 'Preparar leitura' }))
  await user.click(screen.getByRole('button', { name: 'Sincronizar' }))
  const card = screen.getByRole('heading', { name: 'One Piece corrigido' }).closest('li')!
  expect(within(card).getByText('06/04/2026')).toBeVisible()
  expect((remote()!.document.modules.mangas as { items: { id: string }[] }).items[0].id).toBe(id)
  await act(() => cloud.disconnect())
})
it('bloqueia seção corrompida sem substituí-la por dados vazios', async () => {
  const { save, cloud } = await setup({ fileId: 'file', document: { ...emptyEnvelope(), modules: { mangas: { items: [{}] } } } })
  expect(await screen.findByRole('alert')).toHaveTextContent('registro de mangá inválido')
  expect(screen.getByRole('button', { name: 'Cadastrar mangá' })).toBeDisabled()
  expect(save).not.toHaveBeenCalled()
  await act(() => cloud.disconnect())
})
