import { useState } from 'react'
import { formatDate } from '../../lib/format'
import { lessonSchema, type LessonForm } from '../../lib/validation'
import type { CreateLessonInput, UpdateLessonInput } from '../../services/academy'
import type { Lesson, LessonKind, Recommendation } from '../../shared/types'
import { RecommendationBadge } from './AcademyView'

type FormState = {
  kind: LessonKind
  title: string
  body: string
  coinId: string
  coinSymbol: string
  recommendation: Recommendation | ''
}

const emptyForm: FormState = {
  kind: 'lesson',
  title: '',
  body: '',
  coinId: '',
  coinSymbol: '',
  recommendation: '',
}

export function AcademyManageView({
  lessons,
  onCreate,
  onUpdate,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  lessons: Lesson[]
  onCreate: (input: CreateLessonInput) => Promise<boolean>
  onUpdate: (id: string, input: UpdateLessonInput) => Promise<boolean>
  onPublish: (id: string) => Promise<boolean>
  onUnpublish: (id: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LessonForm, string>>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
  }

  function startEdit(lesson: Lesson) {
    setEditingId(lesson.id)
    setForm({
      kind: lesson.kind,
      title: lesson.title,
      body: lesson.body,
      coinId: lesson.coinId ?? '',
      coinSymbol: lesson.coinSymbol ?? '',
      recommendation: lesson.recommendation ?? '',
    })
    setErrors({})
    setMessage(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const candidate: LessonForm = {
      kind: form.kind,
      title: form.title,
      body: form.body,
      coinId: form.coinId.trim() || undefined,
      coinSymbol: form.coinSymbol.trim() || undefined,
      recommendation: form.recommendation || undefined,
    }
    const parsed = lessonSchema.safeParse(candidate)
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LessonForm, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LessonForm | undefined
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setBusy(true)
    const data = parsed.data
    const isSignal = data.kind === 'signal'
    const coinId = isSignal ? data.coinId ?? null : null
    const coinSymbol = isSignal ? data.coinSymbol ?? null : null
    const recommendation = isSignal ? data.recommendation ?? null : null

    let ok: boolean
    if (editingId) {
      ok = await onUpdate(editingId, { title: data.title, body: data.body, coinId, coinSymbol, recommendation })
    } else {
      ok = await onCreate({ kind: data.kind, title: data.title, body: data.body, coinId, coinSymbol, recommendation })
    }

    setBusy(false)
    if (ok) {
      setMessage(editingId ? 'Contenido actualizado' : 'Contenido creado')
      resetForm()
    } else {
      setMessage('No fue posible guardar el contenido')
    }
  }

  async function runAction(action: () => Promise<boolean>, successMsg: string) {
    setBusy(true)
    const ok = await action()
    setBusy(false)
    setMessage(ok ? successMsg : 'La operacion fallo')
  }

  const isSignal = form.kind === 'signal'

  return (
    <section className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
        <h2 className="text-lg font-black">{editingId ? 'Editar contenido' : 'Nuevo contenido'}</h2>
        <p className="text-sm text-slate-500">Lecciones educativas o señales de compra/venta.</p>

        {message && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">{message}</p>}

        <div className="mt-4 grid gap-4">
          {!editingId && (
            <label className="block">
              <span className="text-xs font-bold uppercase text-slate-500">Tipo</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.kind}
                onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value as LessonKind }))}
              >
                <option value="lesson">Leccion</option>
                <option value="signal">Señal</option>
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">Titulo</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            {errors.title && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.title}</span>}
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase text-slate-500">Contenido</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={5}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            />
            {errors.body && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.body}</span>}
          </label>

          {isSignal && (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Moneda (id)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="bitcoin"
                  value={form.coinId}
                  onChange={(event) => setForm((prev) => ({ ...prev, coinId: event.target.value }))}
                />
                {errors.coinId && <span className="mt-1 block text-xs font-semibold text-red-600">{errors.coinId}</span>}
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Simbolo</span>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="BTC"
                  value={form.coinSymbol}
                  onChange={(event) => setForm((prev) => ({ ...prev, coinSymbol: event.target.value }))}
                />
                {errors.coinSymbol && (
                  <span className="mt-1 block text-xs font-semibold text-red-600">{errors.coinSymbol}</span>
                )}
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Recomendacion</span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.recommendation}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, recommendation: event.target.value as Recommendation | '' }))
                  }
                >
                  <option value="">Selecciona...</option>
                  <option value="buy">Comprar</option>
                  <option value="sell">Vender</option>
                  <option value="hold">Mantener</option>
                </select>
                {errors.recommendation && (
                  <span className="mt-1 block text-xs font-semibold text-red-600">{errors.recommendation}</span>
                )}
              </label>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {editingId ? 'Guardar cambios' : 'Crear'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold shadow-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="border-b border-slate-200 bg-white px-4 py-4">
          <h2 className="text-lg font-black">Todo el contenido</h2>
          <p className="text-sm text-slate-500">Incluye lo publicado y los borradores.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Titulo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <p className="font-bold">{lesson.title}</p>
                    {lesson.kind === 'signal' && lesson.recommendation && (
                      <div className="mt-1">
                        <RecommendationBadge recommendation={lesson.recommendation} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{lesson.kind === 'signal' ? 'Señal' : 'Leccion'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        lesson.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {lesson.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(lesson.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busy}
                        onClick={() => startEdit(lesson)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-sky-50 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      {lesson.published ? (
                        <button
                          disabled={busy}
                          onClick={() => runAction(() => onUnpublish(lesson.id), 'Contenido despublicado')}
                          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-50 disabled:opacity-50"
                        >
                          Despublicar
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => runAction(() => onPublish(lesson.id), 'Contenido publicado')}
                          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
                        >
                          Publicar
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => runAction(() => onDelete(lesson.id), 'Contenido eliminado')}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lessons.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No hay contenido todavia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
