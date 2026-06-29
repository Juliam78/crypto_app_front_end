import { apiFetch } from '../lib/api'
import type { AssistantReply } from '../shared/types'

// Cuerpo de petición hacia el backend (camelCase, igual que el contrato de la API).
type AskAssistantBody = {
  question: string
  coinId?: string
}

// Pregunta a la mascota IA "Cripto". Si la ruta actual es un detalle de moneda,
// se pasa el coinId como contexto. El token Bearer lo adjunta apiFetch.
export async function askAssistant(question: string, coinId?: string): Promise<AssistantReply> {
  const body: AskAssistantBody = coinId ? { question, coinId } : { question }
  return apiFetch<AssistantReply>('/api/assistant/ask', { method: 'POST', body })
}
