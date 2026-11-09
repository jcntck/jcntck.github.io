import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { absoluteDay, calendarSince, elapsed, localDay, readingEmphasis, validDay } from './dates'
import { useLocalDay } from './useLocalDay'
afterEach(() => vi.useRealTimers())

it.each([
  ['2026-11-09', '2026-11-09', 'Lido há 0 anos 0 meses 0 dias'],
  ['2026-11-08', '2026-11-09', 'Lido há 0 anos 0 meses 1 dia'],
  ['2026-11-01', '2026-11-19', 'Lido há 0 anos 0 meses 18 dias'],
  ['2026-04-06', '2026-11-06', 'Lido há 0 anos 7 meses 0 dias'],
  ['2024-11-06', '2026-11-06', 'Lido há 2 anos 0 meses 0 dias'],
  ['2026-01-31', '2026-02-28', 'Lido há 0 anos 1 mês 0 dias'],
  ['2024-02-29', '2025-02-28', 'Lido há 1 ano 0 meses 0 dias'],
  ['2026-01-31', '2026-02-27', 'Lido há 0 anos 0 meses 27 dias'],
  ['2025-11-10', '2026-11-09', 'Lido há 0 anos 11 meses 30 dias'],
  ['2026-11-10', '2026-11-09', 'Confira a data de leitura'],
  ['2024-07-25', '2026-11-09', 'Lido há 2 anos 3 meses 15 dias'],
  ['2024-02-29', '2025-03-28', 'Lido há 1 ano 0 meses 28 dias'],
  ['2026-01-31', '2026-03-30', 'Lido há 0 anos 1 mês 30 dias'],
  ['2026-01-31', '2026-03-31', 'Lido há 0 anos 2 meses 0 dias'],
  ['0001-01-01', '0001-01-02', 'Lido há 0 anos 0 meses 1 dia'],
])('calcula %s até %s por calendário civil', (from, today, expected) => expect(elapsed(from, today)).toBe(expected))
it('valida o calendário e formata sem converter fuso', () => {
  expect(validDay('2024-02-29')).toBe(true)
  for (const date of ['1900-02-29', '0000-01-01', '2026-04-31', '2026-13-01', '2026-1-01']) expect(validDay(date)).toBe(false)
  expect(absoluteDay('2026-04-06')).toBe('06/04/2026')
  expect(localDay(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09')
  expect(elapsed('2026-03-07', '2026-03-09')).toBe('Lido há 0 anos 0 meses 2 dias')
})
it('recalcula ao abrir, virar o dia local e recuperar foco', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 9, 23, 59, 59))
  const hook = renderHook(useLocalDay)
  expect(hook.result.current).toBe('2026-11-09')
  act(() => vi.advanceTimersByTime(1020))
  expect(hook.result.current).toBe('2026-11-10')
  act(() => { vi.setSystemTime(new Date(2026, 10, 12, 8)); window.dispatchEvent(new Event('focus')) })
  expect(hook.result.current).toBe('2026-11-12')
  hook.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it.each([
  ['2026-05-09', '2026-11-08', 'recent'],
  ['2026-05-09', '2026-11-09', 'medium'],
  ['2025-11-09', '2026-11-08', 'medium'],
  ['2025-11-09', '2026-11-09', 'long'],
  ['2024-02-29', '2025-02-28', 'long'],
  ['2026-11-10', '2026-11-09', 'recent'],
])('gradua o destaque em %s até %s sem criar atraso', (from, today, expected) => {
  expect(readingEmphasis(from, today)).toBe(expected)
})
it('separa meses completos e dias restantes sem alterar a data civil', () => {
  expect(calendarSince('2024-07-25', '2026-11-09')).toEqual({ years: 2, months: 3, days: 15, totalMonths: 27 })
  expect(calendarSince('2026-11-10', '2026-11-09')).toBeNull()
})
