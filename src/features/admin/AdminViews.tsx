import { useState } from 'react'
import { Avatar } from '../../components/shared'
import { formatDate } from '../../lib/format'
import { originalAdminEmail } from '../../services/storage'
import type { AppErrorLog, AppUser, Role } from '../../shared/types'

export function ErrorsView({ errors }: { errors: AppErrorLog[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <h2 className="text-lg font-black">Errores de la aplicacion</h2>
        <p className="text-sm text-slate-500">Registro de fallos con la ruta interna donde ocurrieron.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Mensaje</th>
              <th className="px-4 py-3">Usuario</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error) => (
              <tr key={error.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(error.created_at)}</td>
                <td className="px-4 py-3">{error.route}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{error.message}</p>
                  {error.stack && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{error.stack}</p>}
                </td>
                <td className="px-4 py-3">{error.user_email ?? 'Sin usuario'}</td>
              </tr>
            ))}
            {errors.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  No hay errores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function UsersAdminView({
  currentUser,
  users,
  onRoleChange,
}: {
  currentUser: AppUser
  users: AppUser[]
  onRoleChange: (targetUserId: string, role: Role) => Promise<boolean>
}) {
  const [message, setMessage] = useState<string | null>(null)
  const canPromote = currentUser.email === originalAdminEmail

  return (
    <section className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <h2 className="text-lg font-black">Usuarios</h2>
        <p className="text-sm text-slate-500">
          {canPromote ? 'Puedes designar usuarios como administradores.' : 'Solo el administrador original puede cambiar roles.'}
        </p>
      </div>
      {message && <p className="m-4 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">{message}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={item} size="sm" />
                    <span className="font-bold">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.role === 'admin' ? 'Administrador' : 'Usuario'}</td>
                <td className="px-4 py-3">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold shadow-sm hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canPromote || item.email === originalAdminEmail}
                    onClick={async () => {
                      const nextRole = item.role === 'admin' ? 'user' : 'admin'
                      const ok = await onRoleChange(item.id, nextRole)
                      setMessage(ok ? 'Rol actualizado correctamente' : 'No fue posible cambiar el rol')
                    }}
                  >
                    {item.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
