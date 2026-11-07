import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const expectedVersion = process.env.EXPECTED_VERSION || (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version
const expectedCommit = process.env.EXPECTED_COMMIT || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

test.beforeEach(async ({ request }) => {
  await expect.poll(async () => {
    const response = await request.get(`version.json?verification=${Date.now()}`)
    if (!response.ok()) return null
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
