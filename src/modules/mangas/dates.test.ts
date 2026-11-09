import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { absoluteDay, elapsed, localDay, validDay } from './dates'
import { useLocalDay } from './useLocalDay'
afterEach(() => vi.useRealTimers())

it.each([
  ['2026-11-09', '2026-11-09', 'Lido hoje'],
  ['2026-11-08', '2026-11-09', 'Lido há 1 dia'],
  ['2026-11-01', '2026-11-19', 'Lido há 18 dias'],
  ['2026-04-06', '2026-11-06', 'Lido há 7 meses'],
  ['2024-11-06', '2026-11-06', 'Lido há 2 anos'],
  ['2026-01-31', '2026-02-28', 'Lido há 1 mês'],
  ['2024-02-29', '2025-02-28', 'Lido há 1 ano'],
  ['2026-01-31', '2026-02-27', 'Lido há 27 dias'],
  ['2025-11-10', '2026-11-09', 'Lido há 11 meses'],
  ['2026-11-10', '2026-11-09', 'Confira a data de leitura'],
  ['0001-01-01', '0001-01-02', 'Lido há 1 dia'],
])('calcula %s até %s por calendário civil', (from, today, expected) => expect(elapsed(from, today)).toBe(expected))
it('valida o calendário e formata sem converter fuso', () => {
  expect(validDay('2024-02-29')).toBe(true)
  for (const date of ['1900-02-29', '0000-01-01', '2026-04-31', '2026-13-01', '2026-1-01']) expect(validDay(date)).toBe(false)
  expect(absoluteDay('2026-04-06')).toBe('06/04/2026')
  expect(localDay(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09')
  expect(elapsed('2026-03-07', '2026-03-09')).toBe('Lido há 2 dias')
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
