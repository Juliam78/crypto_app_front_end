// Cliente HTTP central contra el API Gateway de los microservicios.
// El gateway expone una única URL base y enruta a cada servicio.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8080'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type JsonInit = Omit<RequestInit, 'body'> & { body?: unknown }

export async function apiFetch<T>(path: string, init: JsonInit = {}): Promise<T> {
  const { body, headers, ...rest } = init
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiError(response.status, `La petición a ${path} falló (${response.status})`)
  }

  // 204 No Content u otras respuestas sin cuerpo.
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`
}
