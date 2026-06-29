import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { askAssistant } from '../../services/assistant'
import { subscribeAssistant } from '../../lib/assistantBus'
import type { AssistantSource } from '../../shared/types'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  source?: AssistantSource
  error?: boolean
}

// Deriva el coinId si estamos en la ruta de detalle (/coin/:coinId), igual que en App.tsx.
function getDetailCoinId(pathname: string): string | undefined {
  const match = pathname.match(/^\/coin\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : undefined
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hola, soy Cripto. Preguntame sobre el mercado o una moneda y te doy sugerencias de compra-venta.',
}

export function AssistantWidget() {
  const location = useLocation()
  const coinId = getDetailCoinId(location.pathname)

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Auto-scroll al final cuando llegan mensajes o cambia el estado de "escribiendo".
  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  // Enfoca el input al abrir el panel.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Envia una pregunta al asistente. Usa el valor de `input` si no se pasa una explicita
  // (caso del bus: pregunta precargada desde Academia).
  const sendQuestion = useCallback(
    async (rawQuestion?: string) => {
      const question = (rawQuestion ?? input).trim()
      if (!question || sending) return

      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: question }
      setMessages((current) => [...current, userMessage])
      setInput('')
      setSending(true)

      try {
        const reply = await askAssistant(question, coinId)
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: 'assistant', text: reply.answer, source: reply.source },
        ])
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'Ups, no pude responder en este momento. Intentalo de nuevo en unos segundos.',
            error: true,
          },
        ])
      } finally {
        setSending(false)
      }
    },
    [coinId, input, sending],
  )

  // Suscripcion al bus: al recibir una peticion desde Academia, abre el panel y envia
  // automaticamente la pregunta precargada.
  useEffect(() => {
    return subscribeAssistant((question) => {
      setOpen(true)
      void sendQuestion(question)
    })
  }, [sendQuestion])

  function handleSend() {
    void sendQuestion()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg">🤖</span>
              <div>
                <p className="text-sm font-black leading-tight">Cripto</p>
                <p className="text-xs font-medium text-white/70">Asistente IA</p>
              </div>
            </div>
            <button
              aria-label="Cerrar chat"
              className="text-sm font-black opacity-70 transition hover:opacity-100"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-slate-950 font-semibold text-white'
                      : message.error
                        ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-900'
                        : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.source === 'fallback' && (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                      modo sin conexion IA
                    </p>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm">
                  Cripto esta escribiendo...
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3">
            <input
              ref={inputRef}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-sky-400"
              placeholder="Escribe tu pregunta..."
              value={input}
              disabled={sending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={sending || input.trim().length === 0}
              onClick={handleSend}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      <button
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-2xl text-white shadow-2xl ring-2 ring-white transition hover:scale-105 hover:bg-slate-800"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  )
}
