import { test, expect } from '@playwright/test'
import type { Envelope } from '../../src/shared/storage/library'
import type { Manga } from '../../src/modules/mangas/model'

test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL), 'Login e Drive simulados são exclusivos do ambiente local/CI.')
test('mescla cache após refresh com obras exclusivas e atualizações individuais do Drive', async ({ page }) => {
  const a: Manga = { id: 'a30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Obra A', lastChapter: '10', lastReadOn: '2026-01-01', updatedAt: '2026-01-01T00:00:00Z' }
  let remote: Envelope = { schemaVersion: 1, revision: 'original', diagnostics: { probe: 'keep' }, modules: { mangas: { items: [a] }, another: 'keep' }, updatedAt: a.updatedAt }
  let writes = 0
  await page.route('https://accounts.google.com/gsi/client', route => route.fulfill({ contentType: 'application/javascript', body: `window.google={accounts:{oauth2:{initTokenClient:config=>({requestAccessToken:()=>config.callback({access_token:'synthetic-drive',expires_in:3600,scope:'https://www.googleapis.com/auth/drive.file openid'})}),hasGrantedAllScopes:()=>true}}};` }))
  await page.route('https://openidconnect.googleapis.com/v1/userinfo', route => route.fulfill({ json: { sub: 'test-google-A' } }))
  await page.route('https://www.googleapis.com/**', async route => {
    const request = route.request(); const url = new URL(request.url())
    if (request.method() === 'PATCH') { writes++; remote = request.postDataJSON() as Envelope; await route.fulfill({ json: {} }) }
    else if (url.pathname.endsWith('/about')) await route.fulfill({ json: { user: { permissionId: 'test-permission', displayName: 'Conta simulada' } } })
    else if (url.searchParams.get('alt') === 'media') await route.fulfill({ json: remote })
    else await route.fulfill({ json: { files: [{ id: 'test-file' }] } })
  })
  await page.goto('http://127.0.0.1:5175/tests/browser/fixtures/auth.html#/mangas')
  await page.getByRole('button', { name: 'Entrar com Google' }).click()
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Obra A', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cadastrar mangá', exact: true }).click()
  await page.getByLabel('Título', { exact: true }).fill('Obra B')
  await page.getByLabel('Último capítulo lido').fill('30')
  await page.getByLabel('Data da leitura').fill('2026-01-02')
  await page.getByRole('button', { name: 'Salvar leitura' }).click()
  await expect(page.getByRole('heading', { name: 'Obra B', exact: true })).toBeVisible()
  expect(writes).toBe(0)
  const newerA = { ...a, lastChapter: '20', updatedAt: '2026-02-01T00:00:00Z' }
  const c = { ...a, id: 'c30bb95b-a749-4366-8e68-ec1e3f7bc5f3', title: 'Obra C' }
  remote = { ...remote, updatedAt: '2099-01-01T00:00:00Z', modules: { mangas: { items: [newerA, c] }, another: 'keep' } }
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Obra B', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sincronizar', exact: true }).click()
  await expect(page.getByRole('img', { name: /^Confirmado no Drive:/ })).toHaveCount(3)
  expect(writes).toBe(1)
  const saved = (remote.modules.mangas as { items: Manga[] }).items
  expect(saved.map(item => item.title).sort()).toEqual(['Obra A', 'Obra B', 'Obra C'])
  expect(saved.find(item => item.id === a.id)?.lastChapter).toBe('20')
  expect(remote.modules.another).toBe('keep'); expect(remote.diagnostics.probe).toBe('keep')
  await page.reload()
  for (const title of ['Obra A', 'Obra B', 'Obra C']) await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  expect(writes).toBe(1)
})
