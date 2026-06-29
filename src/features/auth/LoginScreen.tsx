import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '../../lib/validation'
import type { AppUser } from '../../shared/types'

export function LoginScreen({
  onLogin,
  onRegister,
}: {
  onLogin: (values: LoginForm) => Promise<AppUser | null>
  onRegister: (values: RegisterForm) => Promise<AppUser | null>
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const cryptoCoinsLogin = [
    { name: 'Bitcoin', price: '$105,240', change: '+2.48%', tone: 'text-emerald-300' },
    { name: 'Ethereum', price: '$3,860', change: '+1.12%', tone: 'text-emerald-300' },
    { name: 'Solana', price: '$171.22', change: '-0.84%', tone: 'text-red-300' },
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_32%),linear-gradient(135deg,#08111f,#0f2f3a_48%,#052e3d)] px-4 py-6 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_430px]">
        <div className="space-y-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-sky-200">CryptoApp</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
              Compra, vende y analiza criptomonedas desde un solo tablero.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
              Consulta precios en USD, revisa movimientos del mercado y lleva el historial de tus operaciones academicas.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {cryptoCoinsLogin.map(({name, price, change, tone}) => (
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur" key={name}>
                <p className="text-xs font-bold uppercase text-slate-300">{name}</p>
                <p className="mt-2 text-2xl font-black">{price}</p>
                <p className={`mt-1 text-sm font-bold ${tone}`}>{change}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white p-6 text-slate-950 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Acceso</p>
              <h2 className="mt-1 text-2xl font-black">{mode === 'login' ? 'Ingresa a tu cuenta' : 'Crea tu usuario'}</h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-white">
              C
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setMode('login')
                setError(null)
                reset({ name: '', email: '', password: '' })
              }}
              type="button"
            >
              Inicio de sesión
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm font-bold ${mode === 'register' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setMode('register')
                setError(null)
                reset({ name: '', email: '', password: '' })
              }}
              type="button"
            >
              Registro
            </button>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit(async (values) => {
              setError(null)
              const profile = await (async () => {
                if (mode === 'login') {
                  const parsed = loginSchema.safeParse(values)
                  if (!parsed.success) {
                    setError(parsed.error.issues[0]?.message ?? 'Datos invalidos')
                    return null
                  }
                  return onLogin(parsed.data)
                }

                const parsed = registerSchema.safeParse(values)
                if (!parsed.success) {
                  setError(parsed.error.issues[0]?.message ?? 'Datos invalidos')
                  return null
                }
                return onRegister(parsed.data)
              })()

              if (!profile) {
                setError(mode === 'login' ? 'Credenciales invalidas o el usuario no existe' : 'No fue posible crear el usuario')
              }
            })}
          >
            {mode === 'register' && (
              <label className="block text-sm font-semibold">
                Nombre
                <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" {...register('name')} />
                {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
              </label>
            )}
            <label className="block text-sm font-semibold">
              Correo
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" {...register('email')} />
              {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
            </label>
            <label className="block text-sm font-semibold">
              Contrasena
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" type="password" {...register('password')} />
              {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
            <button className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-bold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={isSubmitting}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
