import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../lib/format'
import { requestAssistant } from '../../lib/assistantBus'
import type { Lesson, LessonKind, Recommendation } from '../../shared/types'

const recommendationStyles: Record<Recommendation, { label: string; className: string }> = {
  buy: { label: 'Comprar', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  sell: { label: 'Vender', className: 'bg-red-50 text-red-700 border-red-200' },
  hold: { label: 'Mantener', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const style = recommendationStyles[recommendation]
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${style.className}`}>
      {style.label}
    </span>
  )
}

type KindFilter = 'all' | LessonKind

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Todo' },
  { value: 'lesson', label: 'Lecciones' },
  { value: 'signal', label: 'Señales' },
]

// Genera un extracto corto del cuerpo para la vista contraida.
function excerpt(body: string, max = 160): string {
  const trimmed = body.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const isSignal = lesson.kind === 'signal'
  const needsToggle = lesson.body.trim().length > 160

  function handleApplySignal() {
    if (!lesson.coinId) return
    navigate(`/coin/${encodeURIComponent(lesson.coinId)}`)
  }

  function handleAskAssistant() {
    const question = isSignal
      ? `¿Qué opinas de la señal de ${lesson.coinSymbol?.toUpperCase() ?? 'esta moneda'}: ${lesson.title}?`
      : `Explícame: ${lesson.title}`
    requestAssistant(question)
  }

  return (
    <article className="flex flex-col rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-sky-700">
            {isSignal ? 'Señal' : 'Leccion'}
          </span>
          <h3 className="text-lg font-black text-slate-950">{lesson.title}</h3>
        </div>
        {isSignal && lesson.recommendation && <RecommendationBadge recommendation={lesson.recommendation} />}
      </div>

      {isSignal && lesson.coinSymbol && (
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Moneda: <span className="uppercase">{lesson.coinSymbol}</span>
        </p>
      )}

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {expanded ? lesson.body : excerpt(lesson.body)}
      </p>

      {needsToggle && (
        <button
          className="mt-2 self-start text-xs font-bold text-sky-700 transition hover:text-sky-900"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Ver menos' : 'Ver mas'}
        </button>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Por {lesson.authorName} · {formatDate(lesson.createdAt)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {isSignal && lesson.coinId && (
          <button
            className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            onClick={handleApplySignal}
          >
            Aplicar señal
          </button>
        )}
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
          onClick={handleAskAssistant}
        >
          Preguntarle a Cripto
        </button>
      </div>
    </article>
  )
}

export function AcademyView({ lessons }: { lessons: Lesson[] }) {
  const [kind, setKind] = useState<KindFilter>('all')
  const [search, setSearch] = useState('')
  const [coin, setCoin] = useState('all')

  const published = useMemo(() => lessons.filter((lesson) => lesson.published), [lessons])

  // Monedas disponibles, derivadas de los coinSymbol presentes en las señales publicadas.
  const coinOptions = useMemo(() => {
    const symbols = new Set<string>()
    published.forEach((lesson) => {
      if (lesson.kind === 'signal' && lesson.coinSymbol) {
        symbols.add(lesson.coinSymbol.toUpperCase())
      }
    })
    return Array.from(symbols).sort()
  }, [published])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return published.filter((lesson) => {
      if (kind !== 'all' && lesson.kind !== kind) return false
      if (coin !== 'all' && (lesson.coinSymbol?.toUpperCase() ?? '') !== coin) return false
      if (term) {
        const haystack = `${lesson.title} ${lesson.body}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [published, kind, coin, search])

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-lg font-black">Academia</h2>
        <p className="text-sm text-slate-500">
          Lecciones educativas y señales de compra/venta publicadas por el equipo.
        </p>
      </div>

      {published.length > 0 && (
        <div className="space-y-3 rounded-xl border border-white/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {KIND_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                  kind === tab.value
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-sky-50 hover:text-sky-800'
                }`}
                onClick={() => setKind(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-sky-400"
              placeholder="Buscar por titulo o contenido..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {coinOptions.length > 0 && (
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-sky-400 sm:w-48"
                value={coin}
                onChange={(event) => setCoin(event.target.value)}
              >
                <option value="all">Todas las monedas</option>
                {coinOptions.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {published.length === 0 ? (
        <div className="rounded-xl border border-white/80 bg-white/95 px-5 py-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
          Aun no hay contenido publicado.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/80 bg-white/95 px-5 py-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
          No hay contenido que coincida con los filtros.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  )
}
