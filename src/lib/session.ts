import type { AppUser } from '../shared/types'

// Sesión persistida en localStorage para sobrevivir a refrescos de página.
const KEY = 'cryptoapp_session'

export type Session = { user: AppUser; token: string }

export function saveSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function getToken(): string | null {
  return getStoredSession()?.token ?? null
}

export function clearSession() {
  localStorage.removeItem(KEY)
}

// Actualiza solo el usuario almacenado (p. ej. tras editar el perfil), conservando el token.
export function updateStoredUser(user: AppUser) {
  const session = getStoredSession()
  if (session) saveSession({ ...session, user })
}
