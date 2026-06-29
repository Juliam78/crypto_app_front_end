import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatMoney, formatHour } from '../lib/format'
import { getAverageCost } from '../lib/portfolio'
import { buildTradeQuote } from '../lib/trade'
import { loginSchema, profileSchema, registerSchema, tradeSchema, type LoginForm, type ProfileForm, type RegisterForm, type TradeForm } from '../lib/validation'
import type { Toast, TradeResult, View } from './types'
import { DetailSkeleton, DetailView, ErrorsView, HistoryView, LoginScreen, MarketView, NavButton, ProfileView, ToastMessage, UsersAdminView, Avatar } from '../features'
import { fetchCoin, fetchTopCoins } from '../services/coingecko'
import { createTradeMovement, getAppErrors, getMovements, getUsers, loginWithProfile, logAppError, logout, registerUser, restoreSession, saveCoinPricesAsAdmin, setUserRole, updateUserProfile, uploadAvatar } from '../services/storage'
import type { AppErrorLog, AppUser, Coin, Currency, Movement, Role } from '../shared/types'

function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const currency: Currency = 'usd'
  const [coins, setCoins] = useState<Coin[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [appErrors, setAppErrors] = useState<AppErrorLog[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null)
  const [view, setView] = useState<View>('market')
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const selectedCoin = coins.find((coin) => coin.id === selectedCoinId) ?? coins[0]

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Restaura la sesión al cargar la página (evita perderla al refrescar).
  useEffect(() => {
    let active = true
    restoreSession().then((restored) => {
      if (!active) return
      if (restored) {
        setUser(restored)
        setView(restored.role === 'admin' ? 'admin' : 'market')
      }
      setAuthReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  function handleLogout() {
    logout()
    setUser(null)
    setView('market')
  }

  function showToast(message: string, tone: Toast['tone'] = 'success') {
    setToast({
      id: crypto.randomUUID(),
      message,
      tone,
    })
  }

  const trackError = useCallback(async (route: string, error: unknown) => {
    await logAppError({
      route,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      user,
    })
    if (user?.role === 'admin') {
      setAppErrors(await getAppErrors())
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true

    async function loadMovements() {
      const rows = await getMovements(user)
      if (active) setMovements(rows)
    }

    loadMovements()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return

    let active = true

    async function loadAdminData() {
      const [errorRows, userRows] = await Promise.all([getAppErrors(), getUsers()])
      if (!active) return
      setAppErrors(errorRows)
      setUsers(userRows)
    }

    loadAdminData()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true
    const refreshMs = view === 'detail' ? 3000 : 20000

    async function loadCoins() {
      setLoading(true)
      try {
        if (view === 'detail' && selectedCoinId) {
          const coin = await fetchCoin(currency, selectedCoinId)
          if (!active || !coin) return
          setCoins((currentCoins) =>
            currentCoins.some((currentCoin) => currentCoin.id === coin.id)
              ? currentCoins.map((currentCoin) => (currentCoin.id === coin.id ? coin : currentCoin))
              : [coin, ...currentCoins],
          )
          setLastSync(new Date().toISOString())
          setSyncError(null)
          await saveCoinPricesAsAdmin([coin], currency, user)
          return
        }

        const data = await fetchTopCoins(currency)
        if (!active) return
        setCoins(data)
        setSelectedCoinId((current) => current ?? data[0]?.id ?? null)
        setLastSync(new Date().toISOString())
        setSyncError(null)
        await saveCoinPricesAsAdmin(data, currency, user)
      } catch (error) {
        if (!active) return
        setSyncError(error instanceof Error ? error.message : 'No fue posible conectar con CoinGecko')
        await trackError(view === 'detail' ? `/detalle/${selectedCoinId}/${currency}` : `/mercado/${currency}`, error)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCoins()
    const timer = window.setInterval(loadCoins, refreshMs)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [currency, user, view, selectedCoinId, trackError])

  const portfolio = useMemo(() => {
    const balances = new Map<string, number>()
    movements.forEach((movement) => {
      const current = balances.get(movement.coin_id) ?? 0
      balances.set(
        movement.coin_id,
        movement.type === 'buy' ? current + movement.quantity : current - movement.quantity,
      )
    })
    return balances
  }, [movements])

  async function reloadMovements(currentUser = user) {
    const rows = await getMovements(currentUser)
    setMovements(rows)
  }

  async function handleLogin(values: LoginForm) {
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) return null
    const profile = await loginWithProfile(parsed.data.email, parsed.data.password)
    if (!profile) {
      await trackError('/login', new Error(`Intento de login fallido para ${parsed.data.email}`))
      return null
    }
    setUser(profile)
    setView(profile.role === 'admin' ? 'admin' : 'market')
    await reloadMovements(profile)
    return profile
  }

  async function handleRegister(values: RegisterForm) {
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) return null
    const profile = await registerUser(parsed.data)
    if (!profile) {
      await trackError('/registro', new Error(`No fue posible crear usuario ${parsed.data.email}`))
      return null
    }
    setUser(profile)
    setView('market')
    await reloadMovements(profile)
    return profile
  }

  async function handleProfileUpdate(values: ProfileForm, avatarFile?: File | null) {
    if (!user) return null
    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) return null

    const avatarUrl = avatarFile ? await uploadAvatar(user.id, avatarFile) : user.avatar_url ?? null
    const profile = await updateUserProfile(user.id, {
      ...parsed.data,
      password: parsed.data.password?.trim() || undefined,
      avatar_url: avatarUrl,
    })

    if (!profile) return null
    setUser(profile)
    return profile
  }

  async function handleTrade(values: TradeForm): Promise<TradeResult> {
    const parsed = tradeSchema.safeParse(values)
    if (!parsed.success || !user || !selectedCoin) {
      return { ok: false, message: 'Operacion invalida', tone: 'error' }
    }
    const balance = portfolio.get(selectedCoin.id) ?? 0

    const averageCost = getAverageCost(movements, user.id, selectedCoin.id, currency)
    const quote = buildTradeQuote({
      amountUsd: parsed.data.amountUsd,
      averageCost,
      coin: selectedCoin,
      type: parsed.data.type,
    })

    if (!quote) {
      return { ok: false, message: 'Operacion invalida', tone: 'error' }
    }

    if (parsed.data.type === 'sell' && quote.quantity > balance) {
      await trackError(`/detalle/${selectedCoin.id}/operacion`, new Error('Intento de venta superior al balance disponible'))
      return {
        ok: false,
        message: `Solo tienes ${formatMoney(balance * selectedCoin.current_price, currency)} disponible para vender`,
        tone: 'error',
      }
    }

    try {
      await createTradeMovement({
        user,
        coin: selectedCoin,
        type: parsed.data.type,
        amountUsd: quote.total,
      })
    } catch (error) {
      await trackError(`/detalle/${selectedCoin.id}/operacion`, error)
      return { ok: false, message: 'No fue posible registrar el movimiento', tone: 'error' }
    }

    await reloadMovements(user)
    const message =
      parsed.data.type === 'buy'
        ? `Compra registrada. Gastaste ${formatMoney(quote.total, currency)} en ${selectedCoin.symbol.toUpperCase()}.`
        : `Venta registrada. Resultado de la transaccion: ${quote.realizedPnl >= 0 ? '+' : ''}${formatMoney(quote.realizedPnl, currency)}.`
    showToast(message, quote.realizedPnl < 0 ? 'error' : 'success')
    return { ok: true, message, tone: quote.realizedPnl < 0 ? 'error' : 'success' }
  }

  async function handleRoleChange(targetUserId: string, role: Role) {
    if (!user) return false
    const updated = await setUserRole(targetUserId, role, user)
    if (!updated) {
      await trackError('/admin/usuarios', new Error('Cambio de rol rechazado o fallido'))
      return false
    }
    setUsers(await getUsers())
    if (updated.id === user.id) setUser(updated)
    return true
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-700">
        <p className="text-sm font-semibold">Cargando sesion...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(14,165,233,0.10)_42%,rgba(245,158,11,0.10))]" />
      {toast && <ToastMessage toast={toast} onClose={() => setToast(null)} />}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">CryptoApp</p>
            <h1 className="text-xl font-black text-slate-950">Mercado academico de criptomonedas</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm">
              USD
            </span>
            <button
              className="flex items-center gap-2 rounded-full bg-slate-950 px-2 py-1.5 pr-3 text-sm font-bold text-white shadow-sm"
              onClick={() => setView('profile')}
            >
              <Avatar user={user} size="sm" />
              {user.name}
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-xl border border-white/80 bg-white/90 p-2 shadow-sm backdrop-blur">
          <NavButton active={view === 'market'} onClick={() => setView('market')} label="Mercado" />
          <NavButton active={view === 'history'} onClick={() => setView('history')} label="Historial" />
          <NavButton active={view === 'profile'} onClick={() => setView('profile')} label="Perfil" />
          {user.role === 'admin' && (
            <>
              <NavButton active={view === 'admin'} onClick={() => setView('admin')} label="Compras y ventas" />
              <NavButton active={view === 'errors'} onClick={() => setView('errors')} label="Errores" />
              <NavButton active={view === 'users'} onClick={() => setView('users')} label="Usuarios" />
            </>
          )}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-bold text-slate-800">Estado del mercado</p>
            <p className="mt-1">Backend: microservicios</p>
            <p>{lastSync ? `Ultima sync: ${formatHour(lastSync)}` : 'Esperando datos'}</p>
            <p>{view === 'detail' ? 'Detalle actualiza cada 3 segundos.' : 'Mercado actualiza cada 20 segundos.'}</p>
          </div>
        </aside>

        <main className="space-y-4">
          {syncError && user.role === 'admin' && view === 'errors' && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
              CoinGecko fallo despues de reintentos incrementales: {syncError}
            </div>
          )}

          {view === 'market' && (
            <MarketView
              coins={coins}
              currency={currency}
              loading={loading && coins.length === 0}
              onSelect={(coin) => {
                setSelectedCoinId(coin.id)
                setView('detail')
              }}
            />
          )}

          {view === 'detail' && selectedCoin && (
            <DetailView
              coin={selectedCoin}
              currency={currency}
              balance={portfolio.get(selectedCoin.id) ?? 0}
              canTrade={user.role === 'user'}
              onTrade={handleTrade}
            />
          )}

          {view === 'detail' && !selectedCoin && <DetailSkeleton />}

          {view === 'history' && (
            <HistoryView movements={movements} currency={currency} title="Historial de movimientos" />
          )}

          {view === 'admin' && user.role === 'admin' && (
            <HistoryView movements={movements} currency={currency} title="Compras y ventas de usuarios" showUser />
          )}

          {view === 'profile' && <ProfileView user={user} onSave={handleProfileUpdate} />}

          {view === 'errors' && user.role === 'admin' && <ErrorsView errors={appErrors} />}

          {view === 'users' && user.role === 'admin' && (
            <UsersAdminView
              currentUser={user}
              onRoleChange={handleRoleChange}
              users={users}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
