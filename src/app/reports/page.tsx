'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ReportsAnalytics } from '@/types'
import { rp } from '@/lib/format'

type Period = '7d' | '30d' | '3m' | '12m'

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '3m', label: '3 Bulan' },
  { key: '12m', label: '12 Bulan' },
]

function BarChart({ data }: { data: Array<{ label: string; revenue: number; order_count: number }> }) {
  if (!data.length) return <p className="text-sm text-stone-400 py-4">Belum ada data</p>
  const maxRev = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex items-end gap-1.5 min-w-max h-40">
        {data.map((d, i) => {
          const pct = Math.max((d.revenue / maxRev) * 100, 2)
          return (
            <div key={i} className="flex flex-col items-center gap-1 group relative" style={{ minWidth: 36 }}>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                <div className="bg-stone-800 text-white text-xs rounded-xl px-3 py-1.5 whitespace-nowrap shadow-xl">
                  <p className="font-bold">{rp(d.revenue)}</p>
                  <p className="text-stone-300">{d.order_count} order</p>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-stone-800" />
              </div>
              <div
                className="w-full rounded-t-lg bg-brand transition-all"
                style={{ height: `${pct}%` }}
              />
              <span className="text-[10px] text-stone-400 rotate-45 origin-left truncate" style={{ maxWidth: 40 }}>{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [data, setData] = useState<ReportsAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (p: Period) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reports/analytics?period=${p}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(period) }, [period, load])

  const summary = data?.summary
  const trend = data?.revenue_trend ?? []
  const bestProducts = data?.best_products ?? []
  const bestCustomers = data?.best_customers ?? []

  const maxProduct = bestProducts[0]?.revenue ?? 1
  const maxCustomer = bestCustomers[0]?.total_spent ?? 1

  return (
    <AppShell>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Laporan penjualan, produk terlaris, dan customer terbaik."
      />

      {/* Period selector */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-white/60 p-1 w-fit border border-white/60">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${key === period ? 'bg-brand text-white shadow' : 'text-stone-500 hover:text-brand'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 glass rounded-2xl p-3 text-sm text-red-600">{error}</div>}
      {loading && <div className="glass rounded-3xl p-10 text-center text-stone-400 mb-5">Memuat data...</div>}

      {/* KPI Summary Cards */}
      {summary && (
        <div className="mb-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-stone-500 mb-1">Total Omzet</p>
            <b className="text-xl">{rp(summary.revenue)}</b>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-stone-500 mb-1">Total Order</p>
            <b className="text-xl">{summary.order_count}</b>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-stone-500 mb-1">Rata-rata Order</p>
            <b className="text-xl">{rp(summary.avg_order_value)}</b>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs text-stone-500 mb-1">Customer Unik</p>
            <b className="text-xl">{summary.unique_customers}</b>
          </div>
        </div>
      )}

      {/* Revenue Trend Chart */}
      {trend.length > 0 && (
        <div className="glass rounded-3xl p-5 mb-5">
          <h3 className="font-extrabold mb-1">Tren Omzet</h3>
          <p className="text-xs text-stone-400">Hover bar untuk detail</p>
          <BarChart data={trend} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Best Products */}
        <div className="glass rounded-3xl p-5">
          <h3 className="font-extrabold mb-4">🏆 Produk Terlaris</h3>
          {bestProducts.length === 0 && <p className="text-sm text-stone-400 py-4">Belum ada data.</p>}
          <div className="space-y-3">
            {bestProducts.map((p, i) => (
              <div key={p.product_name} className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-stone-100 text-stone-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-stone-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-semibold truncate">{p.product_name}</span>
                    <span className="text-xs text-stone-500 shrink-0 ml-2">{p.quantity}x</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(p.revenue / maxProduct) * 100}%` }} />
                  </div>
                  <p className="text-xs text-brand font-semibold mt-1">{rp(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Customers */}
        <div className="glass rounded-3xl p-5">
          <h3 className="font-extrabold mb-4">⭐ Customer Terbaik</h3>
          {bestCustomers.length === 0 && <p className="text-sm text-stone-400 py-4">Belum ada data.</p>}
          <div className="space-y-3">
            {bestCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-stone-100 text-stone-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white text-stone-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-semibold truncate">{c.name}</span>
                    <span className="text-xs text-stone-500 shrink-0 ml-2">{c.order_count} order</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(c.total_spent / maxCustomer) * 100}%` }} />
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">{rp(c.total_spent)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
