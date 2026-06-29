import { apiFetch } from '../lib/api'
import type { Coin, Currency } from '../shared/types'

// El polling y el backoff hacia CoinGecko ahora viven en el market-service del backend.
// El frontend solo consulta el gateway, que devuelve los precios ya normalizados y cacheados.
export async function fetchTopCoins(currency: Currency): Promise<Coin[]> {
  return apiFetch<Coin[]>(`/api/market/coins?currency=${currency}`)
}

export async function fetchCoin(currency: Currency, coinId: string): Promise<Coin | null> {
  try {
    return await apiFetch<Coin>(`/api/market/coins/${coinId}?currency=${currency}`)
  } catch {
    return null
  }
}
