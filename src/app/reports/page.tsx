'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'

type Any = Record<string, any>

export default function Reports() {
  const [data, setData] = useState<Any | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/dashboard')
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      setData(j.data)
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const stats = data?.stats || {}
  const orders = data?.latest_orders || []
  const channels = data?.channels || []

  const rp = (n: number) => 'Rp' + Number(n || 0).toLocaleString('id-ID')

  // Calculate conversion rate
  const totalLeads = stats.total_leads || 0
  const totalOrders = stats.total_orders || 0
  const conversionRate = totalLeads > 0 ? ((totalOrders / totalLeads) * 100).toFixed(1) : '0'

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        subtitle="Analitik omzet, channel, dan conversion."
      />

      {loading && <span className="pill mb-3">Loading...</span>}

      {/* KPI cards */}
      <section className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-3xl p-5">
          <p className="text-xs text-stone-500">Omzet (Recent Orders)</p>
          <b className="text-2xl">{rp(stats.revenue)}</b>
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="text-xs text-stone-500">Total Customers</p>
          <b className="text-2xl">{stats.total_customers || 0}</b>
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="text-xs text-stone-500">Conversion Rate</p>
          <b className="text-2xl">{conversionRate}%</b>
          <p className="text-xs text-stone-400">{totalLeads} leads → {totalOrders} orders</p>
        </div>
        <div className="glass rounded-3xl p-5">
          <p className="text-xs text-stone-500">Pending Invoice</p>
          <b className="text-2xl text-amber-700">{stats.pending_invoices || 0}</b>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Channel breakdown */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 font-extrabold">Omzet per Channel</h3>
          {channels.map((c: Any) => (
            <div key={c.name} className="mb-3 rounded-2xl bg-white/60 p-3 text-sm">
              <div className="flex justify-between mb-1">
                <b>{c.name}</b>
                <span className="text-stone-500">{c.count} order</span>
              </div>
              <p className="text-brand font-semibold">{rp(c.revenue)}</p>
              {/* Progress bar */}
              <div className="mt-2 h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${channels.length > 0
                      ? ((c.revenue / Math.max(...channels.map((x: Any) => x.revenue))) * 100)
                      : 0}%`
                  }}
                />
              </div>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="text-sm text-stone-500 py-4">Belum ada data channel.</p>
          )}
        </div>

        {/* Latest orders */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 font-extrabold">Order Terbaru</h3>
          <div className="space-y-2">
            {orders.map((o: Any) => (
              <div key={o.id} className="flex justify-between items-center rounded-xl bg-white/60 p-3 text-sm">
                <div>
                  <a href={`/orders/${o.id}`} className="font-semibold text-brand hover:underline">
                    {o.order_no}
                  </a>
                  <p className="text-xs text-stone-500">{o.customers?.name || '-'}</p>
                </div>
                <div className="text-right">
                  <span className="pill">{o.status}</span>
                  <p className="text-xs font-semibold mt-1">{rp(o.grand_total)}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-stone-500 py-4">Belum ada order.</p>
            )}
          </div>
        </div>
      </div>

      {msg && <p className="mt-4 text-sm text-red-600">{msg}</p>}
    </AppShell>
  )
}
