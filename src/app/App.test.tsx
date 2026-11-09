import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { Hub } from '../shared/session/hub'
import type { AuthPort } from '../shared/session/auth-session'

const renderApp = (path = '/', modules: Parameters<typeof App>[0]['modules'] = []) => {
  window.location.hash = path
  const port: AuthPort = { configured: false, initialize: async () => false, observe: () => () => {}, login: async () => {}, logout: async () => {} }
  return render(<HashRouter><App modules={modules} hub={new Hub(port)} /></HashRouter>)
}

describe('shell modular', () => {
  it('abre sem serviços externos e identifica a versão', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'Seu espaço, aos poucos.' })).toBeVisible()
    expect(screen.getByText(/Novos módulos serão adicionados gradualmente/)).toBeVisible()
    expect(screen.getByLabelText('Versão da aplicação')).toHaveTextContent('v0.4.6')
    expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeVisible()
  })
  it('adiciona um módulo sem substituir a navegação inicial', async () => {
    const user = userEvent.setup()
    renderApp('/', [{ id: 'fixture', access: 'public', label: 'Módulo de teste', path: '/fixture', element: <h1>Conteúdo de teste</h1> }])
    await user.click(screen.getByRole('link', { name: 'Módulo de teste' }))
    expect(await screen.findByRole('heading', { name: 'Conteúdo de teste' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Início' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Início' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Seu espaço, aos poucos.' })).toBeVisible()
  })
  it('abre um módulo por endereço direto', () => {
    renderApp('/fixture', [{ id: 'fixture', access: 'public', label: 'Módulo de teste', path: '/fixture', element: <h1>Conteúdo de teste</h1> }])
    expect(screen.getByRole('heading', { name: 'Conteúdo de teste' })).toBeVisible()
  })
  it('oferece recuperação para um endereço inexistente', async () => {
    const user = userEvent.setup()
    renderApp('/inexistente')
    expect(screen.getByRole('heading', { name: 'Vamos voltar ao início?' })).toBeVisible()
    await user.click(screen.getByRole('link', { name: /Voltar ao início/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Seu espaço, aos poucos.' })).toBeVisible()
  })
  it('permite pular a navegação pelo teclado sem mudar a rota', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(window.location.hash).toBe('#/')
  })
})

describe('navegação pessoal', () => {
  it('oculta entrada e bloqueia montagem do módulo sem login', async () => {
    renderApp('/private', [{ id: 'private', path: '/private', label: 'Pessoal', element: <h1>Conteúdo privado</h1> }])
    expect(screen.queryByText('Conteúdo privado')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pessoal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Seu espaço, aos poucos.' })).toBeVisible()
  })
})
