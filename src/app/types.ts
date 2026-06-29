export type View = 'market' | 'detail' | 'history' | 'admin' | 'profile' | 'errors' | 'users'

export type Toast = {
  id: string
  tone: 'success' | 'error'
  message: string
}

export type TradeResult = {
  ok: boolean
  message: string
  tone: Toast['tone']
}
