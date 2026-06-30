import { useMemo } from 'react'
import { Metric } from '../../components/shared'
import { formatMoney } from '../../lib/format'
import { getCashBalance, getHoldings } from '../../lib/portfolio'
import type { Coin, Currency, Movement } from '../../shared/types'

export function WalletView({
  movements,
  coins,
  currency,
}: {
  movements: Movement[]
  coins: Coin[]
  currency: Currency
}) {
  const cash = useMemo(() => getCashBalance(movements), [movements])
  const holdings = useMemo(() => getHoldings(movements, coins), [movements, coins])
  const coinsValue = useMemo(
    () => holdings.reduce((sum, holding) => sum + holding.valueUsd, 0),
    [holdings],
  )
  const netWorth = cash + coinsValue

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-white/80 bg-white/95 p-5 shadow-sm backdrop-blur">
        <h2 className="text-lg font-black">Mi cartera</h2>
        <p className="mt-1 text-sm text-slate-500">
          Saldo virtual disponible y tus tenencias por moneda.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="Dinero disponible" value={formatMoney(cash, currency)} />
          <Metric label="Valor en monedas" value={formatMoney(coinsValue, currency)} />
          <Metric label="Patrimonio total" value={formatMoney(netWorth, currency)} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="border-b border-slate-200 bg-white px-4 py-4">
          <h3 className="text-lg font-black">Saldo por moneda</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Moneda</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Precio actual</th>
                <th className="px-4 py-3">Valor en USD</th>
                <th className="px-4 py-3">PnL realizado</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.coinId} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <span className="font-bold">{holding.coinName}</span>{' '}
                    <span className="text-slate-500">{holding.coinSymbol.toUpperCase()}</span>
                  </td>
                  <td className="px-4 py-3">
                    {holding.quantity.toFixed(6)} {holding.coinSymbol.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">{formatMoney(holding.price, currency)}</td>
                  <td className="px-4 py-3 font-bold">{formatMoney(holding.valueUsd, currency)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-black ${holding.realizedPnl >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {holding.realizedPnl >= 0 ? '+' : ''}
                      {formatMoney(holding.realizedPnl, currency)}
                    </span>
                  </td>
                </tr>
              ))}
              {holdings.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Aun no tienes monedas. Compra alguna desde el mercado para verla aqui.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
