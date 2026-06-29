import type { Toast } from '../../app/types'
import type { AppUser } from '../../shared/types'

export function NavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
        active ? 'bg-slate-950 text-white shadow-md' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-800'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function ToastMessage({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2">
      <div
        className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 shadow-2xl ${
          toast.tone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-red-200 bg-red-50 text-red-900'
        }`}
      >
        <p className="text-sm font-bold">{toast.message}</p>
        <button className="text-sm font-black opacity-70 hover:opacity-100" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

export function Avatar({ user, size = 'md' }: { user: AppUser; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-base',
    lg: 'h-24 w-24 text-3xl',
  }[size]

  if (user.avatar_url) {
    return (
      <img
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white`}
        src={user.avatar_url}
      />
    )
  }

  return (
    <span className={`${sizeClass} flex items-center justify-center rounded-full bg-slate-950 font-black text-white ring-2 ring-white`}>
      {user.name.charAt(0).toUpperCase()}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />
}

export function DetailSkeleton() {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <div className="grid gap-2 md:justify-items-end">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <Skeleton className="h-[420px] w-full rounded-lg" />
    </section>
  )
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
