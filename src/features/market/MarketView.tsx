import { Skeleton } from '../../components/shared'
import { formatMoney } from '../../lib/format'
import type { Coin, Currency } from '../../shared/types'

export function MarketView({
  coins,
  currency,
  loading,
  onSelect,
}: {
  coins: Coin[]
  currency: Currency
  loading: boolean
  onSelect: (coin: Coin) => void
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
        <div>
          <h2 className="text-lg font-black">Top 20 criptomonedas</h2>
          <p className="text-sm text-slate-500">Toca una moneda para ver detalle, grafico y operaciones.</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-bold text-sky-700">
          {loading ? 'Cargando mercado' : `${coins.length} monedas`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Moneda</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">24h</th>
              <th className="px-4 py-3">Capitalizacion</th>
              <th className="px-4 py-3">Volumen</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={`market-skeleton-${index}`} className="border-t border-slate-100">
                  <td className="px-4 py-3"><Skeleton className="h-9 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                </tr>
              ))}
            {coins.map((coin) => (
              <tr key={coin.id} className="cursor-pointer border-t border-slate-100 transition hover:bg-sky-50" onClick={() => onSelect(coin)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img alt={coin.name} className="h-9 w-9 rounded-full ring-2 ring-slate-100" src={coin.image} />
                    <div>
                      <p className="font-bold">{coin.name}</p>
                      <p className="text-xs uppercase text-slate-500">{coin.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{formatMoney(coin.current_price, currency)}</td>
                <td className={`px-4 py-3 font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {coin.price_change_percentage_24h?.toFixed(2)}%
                </td>
                <td className="px-4 py-3">{formatMoney(coin.market_cap, currency)}</td>
                <td className="px-4 py-3">{formatMoney(coin.total_volume, currency)}</td>
              </tr>
            ))}
            {!loading && coins.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  No hay monedas disponibles por el momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
