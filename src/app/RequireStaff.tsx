import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { AppUser } from '../shared/types'

// Protege rutas de staff (admin o empleado): si no lo es, redirige al mercado.
export function RequireStaff({ user, children }: { user: AppUser; children: ReactNode }) {
  if (user.role !== 'admin' && user.role !== 'employee') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
