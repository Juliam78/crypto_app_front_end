import { useEffect, useRef } from 'react'

type Props = {
  symbol: string
}

export function TradingViewWidget({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    containerRef.current.appendChild(widget)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `CRYPTO:${symbol.toUpperCase()}USD`,
      interval: '60',
      timezone: 'America/Bogota',
      theme: 'light',
      style: '1',
      locale: 'es',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  )
}
