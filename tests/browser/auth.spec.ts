import { test, expect } from '@playwright/test'
const fixture = 'http://127.0.0.1:5175/tests/browser/fixtures/auth.html'
test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Fixture Auth é local; a produção verifica somente o artefato público e usa homologação real para login.')

test('restaura login após refresh, mantém Drive independente e sincroniza com fetch nativo', async ({ page }) => {
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: `window.google={accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>config.callback({access_token:'synthetic-drive-only',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file openid'})}),hasGrantedAllScopes:()=>true}}};` }))
  let remoteDocument: unknown = null
  let driveRequests = 0
  let writes = 0
  await page.route('https://openidconnect.googleapis.com/v1/userinfo', route => route.fulfill({ json: { sub: 'test-google-A' } }))
  await page.route('https://www.googleapis.com/**', async route => {
    const request = route.request(); driveRequests++
    const url = new URL(request.url())
    if (request.method() === 'POST') {
      writes++
      const body = request.postData()!
      remoteDocument = JSON.parse(body.split('Content-Type: application/json\r\n\r\n')[1].split('\r\n--')[0])
      await route.fulfill({ json: { id: 'test-file' } })
    } else if (url.pathname.endsWith('/about')) await route.fulfill({ json: { user: { permissionId: 'test-permission', displayName: 'Conta simulada' } } })
    else if (url.searchParams.get('alt') === 'media') await route.fulfill({ json: remoteDocument })
    else await route.fulfill({ json: { files: remoteDocument ? [{ id: 'test-file', webViewLink: 'https://drive.google.com/file/d/test-file/view' }] : [] } })
  })
  await page.goto(`${fixture}#/connection`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu espaço, aos poucos.')
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  expect(driveRequests).toBe(0)
  await page.getByRole('button', { name: 'Conectar Google Drive' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Conta conectada e documento conferido.' })).toBeVisible()
  await page.getByRole('button', { name: 'Preparar amostra' }).click()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click()
  await expect(page.getByText('Gravação confirmada por releitura do Drive.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Abrir arquivo no Google Drive/ })).toHaveAttribute('href', 'https://drive.google.com/file/d/test-file/view')
  const sample = await page.getByRole('heading', { name: 'Amostra retornada pelo Drive' }).locator('..').textContent()
  await page.getByRole('button', { name: 'Reler do Drive' }).click()
  await expect(page.getByText('Nova leitura remota concluída.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Amostra retornada pelo Drive' }).locator('..')).toHaveText(sample!)
  expect(writes).toBe(1)
  const previous = driveRequests
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  await expect(page.getByText(/Drive desconectado/)).toBeVisible()
  expect(driveRequests).toBe(previous)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('synthetic-drive-only')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('logout propaga entre abas e sessão de trinta dias não é restaurada após o limite', async ({ context, page }) => {
  await context.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: 'window.google={accounts:{oauth2:{}}};' }))
  await page.goto(`${fixture}#/`)
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
  const second = await context.newPage(); await second.goto(`${fixture}#/connection`)
  await expect(second.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(second.getByRole('heading', { level: 1 })).toHaveText('Seu espaço, aos poucos.')
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
  await page.clock.install({ time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 1000) })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toHaveCount(0)
})

test('SDK Firebase real persiste e restaura sem sobrescrever o login com estado anônimo', async ({ page }) => {
  const photoURL = 'https://lh3.googleusercontent.com/test-avatar'
  await page.route(photoURL, route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="#c2d4a4"/></svg>' }))
  const authTime = Math.floor(Date.now() / 1000)
  const token = () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: 'https://securetoken.google.com/myhub-847d2', aud: 'myhub-847d2', sub: 'test-firebase-sdk', user_id: 'test-firebase-sdk', auth_time: authTime, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, firebase: { sign_in_provider: 'google.com', identities: { 'google.com': ['test-google-sdk'] } } })}.test-signature`
  }
  let refreshes = 0
  await page.route('https://securetoken.googleapis.com/**', async route => {
    refreshes++
    await route.fulfill({ json: { access_token: token(), id_token: token(), refresh_token: 'synthetic-sdk-refresh', token_type: 'Bearer', expires_in: '3600', user_id: 'test-firebase-sdk', project_id: 'myhub-847d2' } })
  })
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    if (route.request().url().includes('accounts:lookup')) await route.fulfill({ json: { users: [{ localId: 'test-firebase-sdk', displayName: 'SDK simulado', photoUrl: photoURL, providerUserInfo: [{ providerId: 'google.com', rawId: 'test-google-sdk', federatedId: 'https://accounts.google.com/test-google-sdk', displayName: 'SDK simulado', photoUrl: photoURL }] }] } })
    else await route.fulfill({ json: { localId: 'test-firebase-sdk', displayName: 'SDK simulado', idToken: token(), refreshToken: 'synthetic-sdk-refresh', expiresIn: '3600', providerId: 'google.com' } })
  })
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: 'window.google={accounts:{oauth2:{}}};' }))
  await page.goto('http://127.0.0.1:5175/tests/browser/fixtures/auth-sdk.html#/connection')
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Foto de SDK simulado' })).toHaveJSProperty('naturalWidth', 32)
  await expect(page.getByRole('button', { name: 'Trocar conta', exact: true })).toBeVisible()
  const previous = refreshes
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
  expect(refreshes).toBeGreaterThan(previous)
  const avatar = page.getByRole('img', { name: 'Foto de SDK simulado' })
  await expect(avatar).toHaveAttribute('src', photoURL)
  await avatar.dispatchEvent('error', { bubbles: false })
  await expect(avatar).toHaveCount(0)
  await expect(page.getByText('SS', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sair', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
})
