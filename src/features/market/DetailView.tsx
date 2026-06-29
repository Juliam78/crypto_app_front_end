import { useForm, useWatch } from 'react-hook-form'
import { TradingViewWidget } from './TradingViewWidget'
import { Metric } from '../../components/shared'
import type { TradeResult } from '../../app/types'
import { formatMoney } from '../../lib/format'
import { getAvailableUsd } from '../../lib/trade'
import { tradeSchema, type TradeForm } from '../../lib/validation'
import type { Coin, Currency } from '../../shared/types'

export function DetailView({
  coin,
  currency,
  balance,
  canTrade,
  onTrade,
}: {
  coin: Coin
  currency: Currency
  balance: number
  canTrade: boolean
  onTrade: (values: TradeForm) => Promise<TradeResult>
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TradeForm>({
    mode: 'onChange',
    defaultValues: {
      type: 'buy',
      amountUsd: 100,
    },
  })

  const selectedType = useWatch({ control, name: 'type' })
  const selectedAmountUsd = useWatch({ control, name: 'amountUsd' })
  const amountUsdNumber = Number(selectedAmountUsd)
  const maxSellUsd = getAvailableUsd(balance, coin)
  const estimatedQuantity =
    Number.isFinite(amountUsdNumber) && amountUsdNumber > 0 && coin.current_price > 0
      ? amountUsdNumber / coin.current_price
      : 0
  const isSellingTooMuch =
    selectedType === 'sell' && Number.isFinite(amountUsdNumber) && amountUsdNumber > maxSellUsd
  const trendClass = coin.price_change_percentage_24h >= 0 ? 'text-emerald-700' : 'text-red-600'

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <img alt={coin.name} className="h-16 w-16 rounded-full ring-4 ring-slate-100" src={coin.image} />
            <div>
              <h2 className="text-2xl font-black">{coin.name}</h2>
              <p className="text-sm uppercase text-slate-500">{coin.symbol}</p>
            </div>
          </div>
          <div className="grid gap-2 text-right">
            <p className="text-3xl font-black">{formatMoney(coin.current_price, currency)}</p>
            <p className={`font-black ${trendClass}`}>{coin.price_change_percentage_24h?.toFixed(2)}% 24h</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Balance" value={`${balance.toFixed(6)} ${coin.symbol.toUpperCase()}`} />
          <Metric label="Disponible para vender" value={`${Math.max(0, balance).toFixed(6)} ${coin.symbol.toUpperCase()}`} />
          <Metric label="Maximo 24h" value={formatMoney(coin.high_24h, currency)} />
          <Metric label="Minimo 24h" value={formatMoney(coin.low_24h, currency)} />
        </div>
      </div>

      <TradingViewWidget symbol={coin.symbol} />

      {canTrade && (
        <form
          className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur"
          onSubmit={handleSubmit(async (values) => {
            const parsed = tradeSchema.safeParse(values)
            if (!parsed.success) return
            if (parsed.data.type === 'sell' && parsed.data.amountUsd > maxSellUsd) return
            const result = await onTrade(parsed.data)
            if (result.ok) reset({ type: 'buy', amountUsd: 100 })
          })}
        >
          <h3 className="text-lg font-black">Comprar o vender</h3>
          <div className="mt-3 grid gap-6 md:grid-cols-[180px_minmax(260px,420px)_auto] md:items-start md:justify-center">
            <select className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100" {...register('type')}>
              <option value="buy">Comprar</option>
              <option value="sell">Vender</option>
            </select>
            <div>
              <label className="mb-1 block text-center text-xs font-black uppercase text-slate-500">Monto en USD</label>
              <div className="grid grid-cols-[auto_1fr_auto] overflow-hidden rounded-lg border border-slate-300 bg-slate-50 focus-within:border-sky-500 focus-within:ring-4 focus-within:ring-sky-100">
                <button className="min-h-11 border-r border-slate-300 px-4 text-lg font-black text-slate-600 hover:bg-slate-100" onClick={() => setValue('amountUsd', Math.max(1, Math.floor(amountUsdNumber || 0) - 1), { shouldValidate: true })} type="button">
                  -
                </button>
                <input
                  className="w-full bg-transparent px-3 py-2 text-center text-lg font-black outline-none"
                  inputMode="decimal"
                  placeholder="100"
                  type="text"
                  {...register('amountUsd', {
                    setValueAs: (value) => Number(String(value).replace(',', '.')),
                    validate: (value) => {
                      if (!Number.isFinite(value) || value <= 0) return 'El monto debe ser mayor a 0'
                      if (selectedType === 'sell' && value > maxSellUsd) {
                        return `Solo tienes ${formatMoney(maxSellUsd, currency)} disponible para vender`
                      }
                      return true
                    },
                  })}
                />
                <button className="min-h-11 border-l border-slate-300 px-4 text-lg font-black text-slate-600 hover:bg-slate-100" onClick={() => setValue('amountUsd', Math.floor(amountUsdNumber || 0) + 1, { shouldValidate: true })} type="button">
                  +
                </button>
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-slate-500">
                Equivale aprox. a {estimatedQuantity.toFixed(8)} {coin.symbol.toUpperCase()}
              </p>
              {selectedType === 'sell' && (
                <button className="mt-2 block w-full text-center text-xs font-black text-sky-700 hover:text-sky-900" onClick={() => setValue('amountUsd', Number(maxSellUsd.toFixed(2)), { shouldValidate: true })} type="button">
                  Usar maximo disponible: {formatMoney(maxSellUsd, currency)}
                </button>
              )}
            </div>
            <button className="rounded-lg bg-emerald-700 px-5 py-2.5 font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800 disabled:opacity-60" disabled={isSubmitting || (selectedType === 'sell' && (balance <= 0 || isSellingTooMuch))}>
              Registrar
            </button>
          </div>
          {errors.amountUsd && <p className="mt-2 text-center text-sm text-red-600">{errors.amountUsd.message}</p>}
          {isSellingTooMuch && !errors.amountUsd && <p className="mt-2 text-center text-sm font-semibold text-red-600">Solo tienes {formatMoney(maxSellUsd, currency)} disponible para vender.</p>}
          {selectedType === 'sell' && balance <= 0 && <p className="mt-2 text-center text-sm font-semibold text-red-600">No tienes saldo disponible de {coin.symbol.toUpperCase()} para vender.</p>}
        </form>
      )}
    </section>
  )
}
