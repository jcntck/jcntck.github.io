import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const expectedVersion = process.env.EXPECTED_VERSION || (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version
const expectedCommit = process.env.EXPECTED_COMMIT || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

test.beforeEach(async ({ request }) => {
  await expect.poll(async () => {
    const response = await request.get(`version.json?verification=${Date.now()}`)
    if (!response.ok() || !response.headers()['content-type']?.includes('application/json')) return null
    const data = await response.json() as { version: string; commit: string }
    return data
  }, { timeout: process.env.PLAYWRIGHT_BASE_URL ? 90_000 : 10_000, message: 'A versão e o commit publicados devem corresponder à entrega.' }).toEqual({ version: expectedVersion, commit: expectedCommit })
})

test('abre, atualiza e identifica a aplicação sem erros', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(request.url()))
  await page.goto(`./?verification=${expectedCommit}#/`)
  await expect(page.getByRole('heading', { level: 1, name: 'Seu espaço, aos poucos.' })).toBeVisible()
  await expect(page.getByLabel('Versão da aplicação')).toContainText(`v${expectedVersion}`)
  await expect(page.getByLabel('Versão da aplicação')).toContainText(expectedCommit.slice(0, 7))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu espaço, aos poucos.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('shell.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('recupera rota inexistente e navega pelo teclado', async ({ page }) => {
  await page.goto('./#/inexistente')
  await expect(page.getByRole('heading', { name: 'Vamos voltar ao início?' })).toBeVisible()
  await page.getByRole('link', { name: /Voltar ao início/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu espaço, aos poucos.')
  await page.reload()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu espaço, aos poucos.')
})

test('navega para conexão por endereço e mantém layout no celular', async ({ page }) => {
  await page.goto('./#/')
  await page.getByRole('link', { name: 'Conexão', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar Google Drive' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Conexão', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
})

test('conecta ao Drive com fetch nativo do navegador e autorização simulada', async ({ page }) => {
  // Keep native window.fetch: replacing it with a mock hides Illegal invocation.
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.google = { accounts: { oauth2: {
      initTokenClient: config => ({ requestAccessToken: () => config.callback({
        access_token: 'synthetic-browser-test', expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/drive.file'
      }) }), hasGrantedAllScopes: () => true
    } } };`,
  }))
  let accountRequests = 0
  let documentRequests = 0
  await page.route('https://www.googleapis.com/drive/v3/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/about')) {
      accountRequests++
      await route.fulfill({ json: { user: { permissionId: 'synthetic-account', displayName: 'Conta simulada' } } })
    } else {
      documentRequests++
      await route.fulfill({ json: { files: [] } })
    }
  })
  await page.goto('./#/connection')
  await page.getByRole('button', { name: 'Conectar Google Drive' }).click()
  await expect(page.getByRole('status')).toHaveText('Conta conectada e documento conferido.')
  await expect(page.getByRole('button', { name: 'Gravar amostra' })).toBeEnabled()
  expect(accountRequests).toBe(1)
  expect(documentRequests).toBe(1)
  await page.getByRole('button', { name: 'Reler do Drive' }).click()
  await expect(page.getByRole('status')).toHaveText('Nova leitura remota concluída.')
  expect(documentRequests).toBe(2)
})
