// Civil days never pass through the reader's UTC offset or a 24-hour interval.
export function localDay(now = new Date()): string {
  return `${now.getFullYear().toString().padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
function parts(day: string) { return day.split('-').map(Number) }
function daysInMonth(year: number, month: number) {
  return month === 2 ? (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31
}
export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false
  const [year, month, date] = parts(day)
  return year >= 1 && month >= 1 && month <= 12 && date >= 1 && date <= daysInMonth(year, month)
}
export function absoluteDay(day: string) { return parts(day).reverse().map((value, index) => String(value).padStart(index === 2 ? 4 : 2, '0')).join('/') }
function ordinal(day: string) {
  const [year, month, date] = parts(day)
  const previous = year - 1
  let result = previous * 365 + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400) + date
  for (let m = 1; m < month; m++) result += daysInMonth(year, m)
  return result
}
function anniversary(year: number, month: number, date: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(Math.min(date, daysInMonth(year, month))).padStart(2, '0')}`
}
export function calendarSince(lastReadOn: string, today = localDay()) {
  if (lastReadOn > today) return null
  const [year, month, date] = parts(lastReadOn)
  const [currentYear, currentMonth] = parts(today)
  const totalMonths = (currentYear - year) * 12 + currentMonth - month - Number(anniversary(currentYear, currentMonth, date) > today)
  const anchorMonth = year * 12 + month - 1 + totalMonths
  const anchor = anniversary(Math.floor(anchorMonth / 12), anchorMonth % 12 + 1, date)
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days: ordinal(today) - ordinal(anchor), totalMonths }
}
export function elapsed(lastReadOn: string, today = localDay()): string {
  const age = calendarSince(lastReadOn, today)
  if (!age) return 'Confira a data de leitura'
  return `Lido há ${age.years} ${age.years === 1 ? 'ano' : 'anos'} ${age.months} ${age.months === 1 ? 'mês' : 'meses'} ${age.days} ${age.days === 1 ? 'dia' : 'dias'}`
}
export function readingEmphasis(lastReadOn: string, today = localDay()): 'recent' | 'medium' | 'long' {
  const months = calendarSince(lastReadOn, today)?.totalMonths ?? 0
  return months >= 12 ? 'long' : months >= 6 ? 'medium' : 'recent'
}
