import { apiFetch } from '../lib/api'
import type { Lesson, LessonKind, Recommendation } from '../shared/types'

// Cuerpos de petición hacia el backend (camelCase, igual que el contrato de la API).
export type CreateLessonInput = {
  kind: LessonKind
  title: string
  body: string
  coinId?: string | null
  coinSymbol?: string | null
  recommendation?: Recommendation | null
}

export type UpdateLessonInput = {
  title: string
  body: string
  coinId?: string | null
  coinSymbol?: string | null
  recommendation?: Recommendation | null
}

// Lista lecciones/señales. Con token de staff el backend devuelve también las no publicadas.
export async function getLessons(): Promise<Lesson[]> {
  return apiFetch<Lesson[]>('/api/lessons')
}

export async function createLesson(input: CreateLessonInput): Promise<Lesson> {
  return apiFetch<Lesson>('/api/lessons', { method: 'POST', body: input })
}

export async function updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson> {
  return apiFetch<Lesson>(`/api/lessons/${id}`, { method: 'PUT', body: input })
}

export async function deleteLesson(id: string): Promise<void> {
  await apiFetch<void>(`/api/lessons/${id}`, { method: 'DELETE' })
}

export async function publishLesson(id: string): Promise<Lesson> {
  return apiFetch<Lesson>(`/api/lessons/${id}/publish`, { method: 'POST' })
}

export async function unpublishLesson(id: string): Promise<Lesson> {
  return apiFetch<Lesson>(`/api/lessons/${id}/unpublish`, { method: 'POST' })
}
