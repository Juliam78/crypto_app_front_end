export type Currency = 'usd'

export type Role = 'admin' | 'user'

export type AppUser = {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  role: Role
}

export type Coin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_percentage_24h: number
  sparkline_in_7d?: {
    price: number[]
  }
}

export type CoinRecord = Coin & {
  currency: Currency
  last_updated: string
}

export type MovementType = 'buy' | 'sell'

export type Movement = {
  id: string
  user_id: string
  user_name?: string
  coin_id: string
  coin_name: string
  coin_symbol: string
  type: MovementType
  quantity: number
  currency: Currency
  price: number
  total: number
  created_at: string
}

export type AppErrorLog = {
  id: string
  route: string
  message: string
  stack?: string | null
  user_id?: string | null
  user_email?: string | null
  created_at: string
}
