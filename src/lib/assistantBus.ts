// Bus desacoplado para pedirle al AssistantWidget (montado global en App) que se abra
// y precargue/envie una pregunta. Evita acoplar AcademyView al estado del widget.

export type AssistantRequestHandler = (question: string) => void

const handlers = new Set<AssistantRequestHandler>()

// Solicita al asistente abrirse y procesar una pregunta. La invoca AcademyView.
export function requestAssistant(question: string): void {
  const trimmed = question.trim()
  if (!trimmed) return
  handlers.forEach((handler) => handler(trimmed))
}

// Suscribe un handler (lo usa AssistantWidget). Devuelve la funcion de limpieza.
export function subscribeAssistant(handler: AssistantRequestHandler): () => void {
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}
