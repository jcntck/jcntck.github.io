import { describe, expect, it, vi } from 'vitest'
import { authorize, type OAuth, type Grant } from './identity'
import { DRIVE_SCOPE } from './drive'
describe('GIS', () => {
  it.each(['success', 'denied', 'cancelled', 'scope'])('trata %s por ação explícita', async scenario => {
    const grant: Grant = { access_token: 'memory', expires_in: 3600, scope: DRIVE_SCOPE }
    const popup = vi.fn()
    const oauth: OAuth = {
      hasGrantedAllScopes: () => scenario !== 'scope',
      initTokenClient: config => {
        expect(config.scope).toBe(`${DRIVE_SCOPE} openid`); expect(config.include_granted_scopes).toBe(false)
        return { requestAccessToken: options => { popup(options); if (scenario === 'cancelled') config.error_callback(); else config.callback(scenario === 'denied' ? { ...grant, error: 'access_denied' } : grant) } }
      },
    }
    const result = authorize(oauth, 'public-client-id')
    if (scenario === 'success') expect(await result).toEqual(grant)
    else await expect(result).rejects.toThrow(/não concluída/)
    expect(popup).toHaveBeenCalledWith({ prompt: '' })
  })
})
it('usa identidade validada como hint e permite seleção somente por opção explícita', async () => {
  const popup = vi.fn()
  const oauth: OAuth = {
    hasGrantedAllScopes: () => true,
    initTokenClient: config => {
      expect(config.login_hint).toBe('google-sub')
      return { requestAccessToken: options => { popup(options); config.callback({ access_token: 'memory', expires_in: 60, scope: `${DRIVE_SCOPE} openid` }) } }
    },
  }
  await authorize(oauth, 'client', 'google-sub')
  await authorize(oauth, 'client', 'google-sub', true)
  expect(popup.mock.calls).toEqual([[{ prompt: '' }], [{ prompt: 'select_account' }]])
})
