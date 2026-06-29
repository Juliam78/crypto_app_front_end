import type { Coin, Movement } from '../shared/types'

export type TradeQuote = {
  quantity: number
  total: number
  realizedPnl: number
}

export function buildTradeQuote({
  amountUsd,
  averageCost,
  coin,
  type,
}: {
  amountUsd: number
  averageCost: number
  coin: Coin
  type: Movement['type']
}): TradeQuote | null {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || coin.current_price <= 0) return null

  const quantity = amountUsd / coin.current_price
  return {
    quantity,
    total: amountUsd,
    realizedPnl: type === 'sell' ? (coin.current_price - averageCost) * quantity : 0,
  }
}

export function getAvailableUsd(balance: number, coin: Coin) {
  return Math.max(0, balance * coin.current_price)
}
