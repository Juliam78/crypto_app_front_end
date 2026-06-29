import type { Currency, Movement } from '../shared/types'

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

    const soldQuantity = Math.min(movement.quantity, current.quantity || movement.quantity)
    const realizedPnl = (movement.price - current.averageCost) * soldQuantity
    pnlByMovement.set(movement.id, realizedPnl)
    positions.set(key, {
      quantity: Math.max(0, current.quantity - movement.quantity),
      averageCost: current.quantity - movement.quantity > 0 ? current.averageCost : 0,
    })
  })

  return pnlByMovement
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
