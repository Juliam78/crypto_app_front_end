import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { AppUser } from '../shared/types'

// Protege rutas de administrador: si el usuario no es admin, redirige al mercado.
export function RequireAdmin({ user, children }: { user: AppUser; children: ReactNode }) {
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
