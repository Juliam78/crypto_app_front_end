import { ApiError, apiFetch, apiUrl } from '../lib/api'
import { clearSession, getToken, saveSession, updateStoredUser } from '../lib/session'
import type { AppErrorLog, AppUser, Coin, Currency, Movement, Role } from '../shared/types'

// Único admin autorizado a cambiar roles (validado también en el backend).
export const originalAdminEmail = 'admin@crypto.edu'

type AuthResponse = { user: AppUser; token: string }

export async function loginWithProfile(email: string, password: string): Promise<AppUser | null> {
  try {
    const data = await apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    saveSession(data)
    return data.user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  role?: Role
}): Promise<AppUser | null> {
  try {
    const data = await apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { ...input, role: input.role ?? 'user' },
    })
    saveSession(data)
    return data.user
  } catch (error) {
    if (error instanceof ApiError) return null
    throw error
  }
}

// Restaura la sesión tras un refresco usando el token guardado.
export async function restoreSession(): Promise<AppUser | null> {
  const token = getToken()
  if (!token) return null
  try {
    const user = await apiFetch<AppUser>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    updateStoredUser(user)
    return user
  } catch {
    clearSession()
    return null
  }
}

export function logout() {
  clearSession()
}

export async function getUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>('/api/users')
}

export async function setUserRole(targetUserId: string, role: Role, actor: AppUser): Promise<AppUser | null> {
  if (actor.email !== originalAdminEmail) return null

  try {
    const updated = await apiFetch<AppUser>(`/api/users/${targetUserId}/role`, {
      method: 'POST',
      body: { actor_user_id: actor.id, role },
    })
    if (updated.id === actor.id) updateStoredUser(updated)
    return updated
  } catch (error) {
    if (error instanceof ApiError) return null
    throw error
  }
}

export async function updateUserProfile(
  userId: string,
  input: {
    name: string
    email: string
    password?: string
    avatar_url?: string | null
  },
): Promise<AppUser | null> {
  try {
    const updated = await apiFetch<AppUser>(`/api/users/${userId}`, {
      method: 'PUT',
      body: {
        name: input.name,
        email: input.email,
        password: input.password ?? null,
        avatar_url: input.avatar_url ?? null,
      },
    })
    updateStoredUser(updated)
    return updated
  } catch (error) {
    if (error instanceof ApiError) return null
    throw error
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(apiUrl(`/api/users/${userId}/avatar`), {
    method: 'POST',
    body: form,
  })

  if (!response.ok) throw new Error('No fue posible subir la imagen')
  const data = (await response.json()) as { url: string }
  return data.url
}

// El servicio de mercado cachea los precios automáticamente al consultarlos.
// Se mantiene la firma por compatibilidad con App.tsx; ya no hace nada en el cliente.
export async function saveCoinPricesAsAdmin(_coins: Coin[], _currency: Currency, _actor?: AppUser | null) {
  void _coins
  void _currency
  void _actor
}

export async function getMovements(user?: AppUser | null): Promise<Movement[]> {
  if (!user) return []
  const params = new URLSearchParams({ userId: user.id, role: user.role })
  return apiFetch<Movement[]>(`/api/movements?${params}`)
}

type TradeInput = {
  user: AppUser
  coin: Coin
  type: Movement['type']
  amountUsd: number
}

export async function createTradeMovement(input: TradeInput): Promise<Movement> {
  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0 || input.coin.current_price <= 0) {
    throw new Error('Operacion invalida')
  }

  return apiFetch<Movement>('/api/trades', {
    method: 'POST',
    body: {
      userId: input.user.id,
      userName: input.user.name,
      coinId: input.coin.id,
      coinName: input.coin.name,
      coinSymbol: input.coin.symbol,
      type: input.type,
      amountUsd: input.amountUsd,
      priceUsd: input.coin.current_price,
      currency: 'usd',
    },
  })
}

export async function logAppError(input: {
  route: string
  message: string
  stack?: string | null
  user?: AppUser | null
}): Promise<void> {
  try {
    await apiFetch('/api/errors', {
      method: 'POST',
      body: {
        route: input.route,
        message: input.message,
        stack: input.stack ?? null,
        user_id: input.user?.id ?? null,
        user_email: input.user?.email ?? null,
      },
    })
  } catch {
    // El registro de errores nunca debe romper el flujo del usuario.
  }
}

export async function getAppErrors(): Promise<AppErrorLog[]> {
  try {
    return await apiFetch<AppErrorLog[]>('/api/errors')
  } catch {
    return []
  }
}
