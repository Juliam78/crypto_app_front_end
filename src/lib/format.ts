import type { Currency } from '../shared/types'

const locales: Record<Currency, string> = {
  usd: 'en-US',
}

const codes: Record<Currency, string> = {
  usd: 'USD',
}

export function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat(locales[currency], {
    style: 'currency',
    currency: codes[currency],
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatHour(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value))
}