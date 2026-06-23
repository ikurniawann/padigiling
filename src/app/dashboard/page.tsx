'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'
import { rp } from '@/lib/format'

type DashboardStats = {
  revenue: number
  total_orders: number
  total_customers: number
  pending_invoices: number
}

type Order = {
  id: string
  order_no: string
  status: string
  grand_total: number
  customers: { name: string } | null
}

type Channel = {
  name: string
  count: number
  revenue: number
}

type DashboardData = {
  stats: DashboardStats
  latest_orders: Order[]
  channels: Channel[]
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-3xl p-5">
      <p className="text-xs text-stone-500">{label}</p>
      <b className="text-2xl">{value}</b>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const r = await fetch('/api/dashboard')
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      setData(j.data)
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Gagal memuat data')
    }
  }

  useEffect(() => { load() }, [])

  const s = data?.stats

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan real-time dari database CRM Padigiling."
        action={
          <a className="btn btn-primary" href="/create-order">
            Create Order
          </a>
        }
      />

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <Metric label="Omzet"           value={rp(s?.revenue ?? 0)} />
        <Metric label="Total Order"     value={s?.total_orders ?? 0} />
        <Metric label="Customers"       value={s?.total_customers ?? 0} />
        <Metric label="Invoice Pending" value={s?.pending_invoices ?? 0} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
        {/* Latest orders */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 font-extrabold">Order Terbaru</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500">
                <th className="py-2">Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(data?.latest_orders ?? []).map((o) => (
                <tr className="border-b border-white/60" key={o.id}>
                  <td className="py-3">
                    <a className="font-semibold text-brand" href={`/orders/${o.id}`}>
                      {o.order_no}
                    </a>
                  </td>
                  <td>{o.customers?.name ?? '-'}</td>
                  <td><span className="pill">{o.status}</span></td>
                  <td>{rp(o.grand_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.latest_orders?.length && (
            <p className="py-6 text-sm text-stone-500">Belum ada order.</p>
          )}
        </div>

        {/* Channel sales */}
        <div className="glass rounded-3xl p-5">
          <h3 className="mb-3 font-extrabold">Channel Sales</h3>
          {(data?.channels ?? []).map((c) => (
            <div key={c.name} className="mb-3 rounded-2xl bg-white/60 p-3 text-sm">
              <div className="flex justify-between">
                <b>{c.name}</b>
                <span>{c.count} order</span>
              </div>
              <p className="text-stone-500">{rp(c.revenue)}</p>
            </div>
          ))}
          {msg && <p className="text-sm text-red-600">{msg}</p>}
        </div>
      </section>
    </AppShell>
  )
}
