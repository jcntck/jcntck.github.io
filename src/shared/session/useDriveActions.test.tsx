import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { HubContext } from './hooks'
import { Hub } from './hub'
import { useDriveActions } from './useDriveActions'
import { CloudSession } from '../../integrations/google-drive/session'
import { authorize } from '../../integrations/google-drive/identity'
import { applyOperation, emptyEnvelope, type Snapshot, type Operation } from '../storage/library'

vi.mock('../../integrations/google-drive/identity', () => ({ loadIdentity: vi.fn(async () => ({})), authorize: vi.fn() }))
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks() })
async function setup() {
  let remote: Snapshot = { fileId: 'test', document: emptyEnvelope() }
  const save = vi.fn(async (_base: Snapshot | null, operation: Operation) => {
    remote = { ...remote, document: applyOperation(remote.document, operation) }; return remote
  })
  const cloud = new CloudSession(() => ({ subject: async () => 'sub', account: async () => ({ id: 'a', name: 'Teste' }), load: async () => remote, save }), () => 'sub')
  const hub = new Hub({ configured: false, initialize: async () => false, observe: () => () => {}, login: async () => {}, logout: async () => {} }, cloud)
  vi.spyOn(hub.auth, 'isValid').mockReturnValue(true)
  vi.spyOn(hub.auth, 'getSnapshot').mockReturnValue({ ...hub.auth.getSnapshot(), identity: { uid: 'uid', googleId: 'sub', name: 'Teste', authTime: 0, issuedAt: 0 } })
  const hook = renderHook(() => useDriveActions('client'), { wrapper: ({ children }: { children: ReactNode }) => createElement(HubContext.Provider, { value: hub }, children) })
  await waitFor(() => expect(hook.result.current.ready).toBe(true))
  vi.mocked(authorize).mockResolvedValue({ access_token: 'volatile', expires_in: 60, scope: '' })
  return { ...hook, hub, cloud, save }
}
it('conecta sem escrever, depois sincroniza pelo token válido sem outro popup', async () => {
  const { result, cloud, save } = await setup()
  await act(() => result.current.run())
  expect(save).not.toHaveBeenCalled()
  cloud.stageProbe()
  await act(() => result.current.run())
  expect(save).toHaveBeenCalledTimes(1)
  expect(authorize).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem('volatile')).toBeNull()
  cloud.disconnect()
})
it('preserva pendência ao cancelar e não confunde connect resolvido com sucesso', async () => {
  const { result, cloud, save } = await setup()
  await act(() => result.current.run(false))
  cloud.stageProbe(); cloud.disconnect()
  const operation = cloud.getSnapshot().pending
  vi.mocked(authorize).mockRejectedValueOnce(new Error('Cancelado'))
  await act(() => result.current.run())
  expect(save).not.toHaveBeenCalled()
  expect(cloud.getSnapshot().pending).toEqual(operation)
  expect(cloud.getSnapshot().phase).toBe('error')
  cloud.disconnect()
})
it('serializa cliques e não envia resultado tardio depois de logout', async () => {
  const { result, hub, cloud, save } = await setup()
  let resolve!: (value: Awaited<ReturnType<typeof authorize>>) => void
  vi.mocked(authorize).mockReturnValue(new Promise(done => { resolve = done }))
  let first!: Promise<void>
  act(() => { first = result.current.run() })
  await act(() => result.current.run())
  expect(authorize).toHaveBeenCalledTimes(1)
  vi.mocked(hub.auth.isValid).mockReturnValue(false)
  cloud.clearLocalSession()
  resolve({ access_token: 'late', expires_in: 60, scope: '' })
  await act(() => first)
  expect(save).not.toHaveBeenCalled()
  expect(cloud.getSnapshot().phase).toBe('disconnected')
})
