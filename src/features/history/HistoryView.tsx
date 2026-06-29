import { useMemo } from 'react'
import { formatDate, formatMoney } from '../../lib/format'
import { calculateRealizedPnl } from '../../lib/portfolio'
import type { Currency, Movement } from '../../shared/types'

export function HistoryView({ movements, currency, title, showUser = false,
}: {
  movements: Movement[]
  currency: Currency
  title: string
  showUser?: boolean
}) {
  const pnlByMovement = useMemo(() => calculateRealizedPnl(movements), [movements])

  return (
    <section className="overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              {showUser && <th className="px-4 py-3">Usuario</th>}
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Moneda</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Ganancia / perdida</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => {
              const pnl = pnlByMovement.get(movement.id)

              return (
                <tr key={movement.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatDate(movement.created_at)}</td>
                  {showUser && <td className="px-4 py-3">{movement.user_name ?? movement.user_id}</td>}
                  <td className={`px-4 py-3 font-bold ${movement.type === 'buy' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {movement.type === 'buy' ? 'Compra' : 'Venta'}
                  </td>
                  <td className="px-4 py-3">{movement.coin_name}</td>
                  <td className="px-4 py-3">
                    {movement.quantity} {movement.coin_symbol.toUpperCase()}
                  </td>
                  <td className={`px-4 py-3 font-bold ${movement.type === 'buy' ? 'text-red-600' : 'text-emerald-700'}`}>
                    {formatMoney(movement.total, movement.currency ?? currency)}
                  </td>
                  <td className="px-4 py-3">
                    {typeof pnl === 'number' ? (
                      <span className={`font-black ${pnl >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}
                        {formatMoney(pnl, movement.currency ?? currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {movements.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={showUser ? 7 : 6}>
                  No hay movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
