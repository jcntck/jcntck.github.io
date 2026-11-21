import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ReadingCard } from './ReadingCard'

const item = { id: 'test', title: 'Minha obra', englishTitle: 'Hidden title', lastChapter: 'Extra 3', lastReadOn: '2026-04-06', updatedAt: '2026-11-21T12:00:00Z' }
it('mantém os detalhes fora do card e informa pendência/confirmação por nome acessível', () => {
  const props = { item, pending: true, canEdit: true, highlighted: false, onEdit: vi.fn(), onDelete: vi.fn() }
  const { rerender } = render(<ReadingCard {...props} />)
  expect(screen.getByRole('heading')).toHaveTextContent('Minha obra')
  expect(screen.queryByText('Extra 3')).not.toBeInTheDocument()
  expect(screen.queryByText('Hidden title')).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Pendente de sincronização: Minha obra' })).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  rerender(<ReadingCard {...props} pending={false} />)
  expect(screen.getByRole('img', { name: 'Confirmado no Drive: Minha obra' })).toBeInTheDocument()
})
it('revela por toque, abre edição e inclui somente a scan cadastrada', async () => {
  const edit = vi.fn()
  render(<ReadingCard item={{ ...item, scanUrl: 'https://scan.example/obra' }} pending canEdit highlighted={false} onEdit={edit} onDelete={vi.fn()} />)
  const toggle = screen.getByRole('button', { name: 'Ações de Minha obra' })
  await userEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link')).toHaveAttribute('href', 'https://scan.example/obra')
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer')
  fireEvent.keyDown(toggle, { key: 'Escape' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(screen.getByRole('button', { name: 'Editar Minha obra' }))
  expect(edit).toHaveBeenCalledTimes(1)
})
