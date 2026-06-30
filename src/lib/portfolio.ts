import type { Coin, Currency, Movement } from '../shared/types'

// Saldo virtual inicial en USD con el que arranca cada usuario.
export const STARTING_CASH_USD = 10000

// Tenencia agregada por moneda, calculada en el cliente a partir de los movimientos.
export type Holding = {
  coinId: string
  coinSymbol: string
  coinName: string
  quantity: number
  price: number
  valueUsd: number
  realizedPnl: number
}

export function calculateRealizedPnl(movements: Movement[]) {
  const pnlByMovement = new Map<string, number>()
  const positions = new Map<string, { quantity: number; averageCost: number }>()

  const sorted = [...movements].sort(
    (first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
  )

  sorted.forEach((movement) => {
    const key = `${movement.user_id}:${movement.coin_id}:${movement.currency}`
    const current = positions.get(key) ?? { quantity: 0, averageCost: 0 }

    if (movement.type === 'buy') {
      const nextQuantity = current.quantity + movement.quantity
      const nextTotalCost = current.averageCost * current.quantity + movement.price * movement.quantity
      positions.set(key, {
        quantity: nextQuantity,
        averageCost: nextQuantity > 0 ? nextTotalCost / nextQuantity : 0,
      })
      return
    }

    // Solo se realiza PnL sobre la cantidad efectivamente en posición; sin posición previa, 0.
    const soldQuantity = Math.min(movement.quantity, current.quantity)
    const realizedPnl = (movement.price - current.averageCost) * soldQuantity
    pnlByMovement.set(movement.id, realizedPnl)
    positions.set(key, {
      quantity: Math.max(0, current.quantity - movement.quantity),
      averageCost: current.quantity - movement.quantity > 0 ? current.averageCost : 0,
    })
  })

  return pnlByMovement
}

// Efectivo USD disponible: parte del saldo inicial, resta compras y suma ventas (solo en USD).
export function getCashBalance(movements: Movement[]): number {
  return movements.reduce((cash, movement) => {
    if (movement.currency !== 'usd') return cash
    return movement.type === 'buy' ? cash - movement.total : cash + movement.total
  }, STARTING_CASH_USD)
}

// Saldo por moneda: cantidad neta, precio actual, valor en USD y PnL realizado acumulado.
export function getHoldings(movements: Movement[], coins: Coin[]): Holding[] {
  const pnlByMovement = calculateRealizedPnl(movements)

  type Accumulator = {
    coinSymbol: string
    coinName: string
    quantity: number
    realizedPnl: number
  }

  const byCoin = new Map<string, Accumulator>()

  movements.forEach((movement) => {
    const current = byCoin.get(movement.coin_id) ?? {
      coinSymbol: movement.coin_symbol,
      coinName: movement.coin_name,
      quantity: 0,
      realizedPnl: 0,
    }
    current.coinSymbol = movement.coin_symbol
    current.coinName = movement.coin_name
    current.quantity += movement.type === 'buy' ? movement.quantity : -movement.quantity
    current.realizedPnl += pnlByMovement.get(movement.id) ?? 0
    byCoin.set(movement.coin_id, current)
  })

  const holdings: Holding[] = []
  byCoin.forEach((accumulator, coinId) => {
    const quantity = Math.max(0, accumulator.quantity)
    if (quantity <= 0) return
    const price = coins.find((coin) => coin.id === coinId)?.current_price ?? 0
    holdings.push({
      coinId,
      coinSymbol: accumulator.coinSymbol,
      coinName: accumulator.coinName,
      quantity,
      price,
      valueUsd: quantity * price,
      realizedPnl: accumulator.realizedPnl,
    })
  })

  return holdings
}

export function getAverageCost(movements: Movement[], userId: string, coinId: string, currency: Currency) {
  const sorted = [...movements]
    .filter((movement) => movement.user_id === userId && movement.coin_id === coinId && movement.currency === currency)
    .sort((first, second) => new Date(first.created_at).getTime() - new Date(second.created_at).getTime())

  let quantity = 0
  let averageCost = 0

  sorted.forEach((movement) => {
    if (movement.type === 'buy') {
      const nextQuantity = quantity + movement.quantity
      const nextTotalCost = averageCost * quantity + movement.price * movement.quantity
      quantity = nextQuantity
      averageCost = nextQuantity > 0 ? nextTotalCost / nextQuantity : 0
      return
    }

    quantity = Math.max(0, quantity - movement.quantity)
    if (quantity === 0) averageCost = 0
  })

  return averageCost
}
