import { DRIVE_SCOPE } from './drive'

export interface Grant { access_token: string; expires_in: number; scope: string; error?: string }
export interface OAuth {
  initTokenClient(config: { client_id: string; scope: string; include_granted_scopes: boolean; callback: (grant: Grant) => void; error_callback: () => void }): { requestAccessToken(options: { prompt: string }): void }
  hasGrantedAllScopes(grant: Grant, scope: string): boolean
}
declare global { interface Window { google?: { accounts: { oauth2: OAuth } } } }
let loading: Promise<OAuth> | undefined
export function loadIdentity(): Promise<OAuth> {
  if (window.google) return Promise.resolve(window.google.accounts.oauth2)
  if (!loading) loading = new Promise<OAuth>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => window.google ? resolve(window.google.accounts.oauth2) : reject(new Error('Biblioteca Google indisponível.'))
    script.onerror = () => { script.remove(); reject(new Error('Não foi possível carregar a conexão Google.')) }
    document.head.append(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}
// The caller prepares GIS before the click so the popup opens within user activation.
export function authorize(oauth: OAuth, clientId: string): Promise<Grant> {
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error('Conexão não concluída: autorização recusada, cancelada ou popup bloqueado. Tente novamente.'))
    const client = oauth.initTokenClient({ client_id: clientId, scope: `${DRIVE_SCOPE} openid`, include_granted_scopes: false,
      callback: grant => {
        if (grant.error || !grant.access_token || !(Number(grant.expires_in) > 0) || (!oauth.hasGrantedAllScopes(grant, DRIVE_SCOPE) || !oauth.hasGrantedAllScopes(grant, 'openid'))) fail()
        else resolve(grant)
      }, error_callback: fail,
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}
