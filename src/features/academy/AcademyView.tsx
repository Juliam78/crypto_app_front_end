import { formatDate } from '../../lib/format'
import type { Lesson, Recommendation } from '../../shared/types'

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

function LessonCard({ lesson }: { lesson: Lesson }) {
  const isSignal = lesson.kind === 'signal'

  return (
    <article className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
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

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{lesson.body}</p>

      <p className="mt-4 text-xs text-slate-400">
        Por {lesson.authorName} · {formatDate(lesson.createdAt)}
      </p>
    </article>
  )
}

export function AcademyView({ lessons }: { lessons: Lesson[] }) {
  const published = lessons.filter((lesson) => lesson.published)

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/80 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-lg font-black">Academia</h2>
        <p className="text-sm text-slate-500">
          Lecciones educativas y señales de compra/venta publicadas por el equipo.
        </p>
      </div>

      {published.length === 0 ? (
        <div className="rounded-xl border border-white/80 bg-white/95 px-5 py-8 text-center text-sm text-slate-500 shadow-sm backdrop-blur">
          Aun no hay contenido publicado.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {published.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </section>
  )
}
