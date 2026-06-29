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
