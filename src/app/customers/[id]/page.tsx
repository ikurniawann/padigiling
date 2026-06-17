'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Any = Record<string, any>

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<Any | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/customers/' + id)
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      setCustomer(j.data)
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() }, [id])

  if (!customer) return (
    <AppShell>
      <PageHeader title="Customer" subtitle="Loading..." />
      <div className="glass rounded-3xl p-5">{loading ? 'Loading...' : msg}</div>
    </AppShell>
  )

  const orders = customer.orders || []
  const totalSpent = orders.reduce((s: number, o: Any) => s + Number(o.grand_total || 0), 0)
  const completedOrders = orders.filter((o: Any) => o.status === 'completed').length
  const rp = (n: number) => 'Rp' + Number(n || 0).toLocaleString('id-ID')

  return (
    <AppShell>
      <PageHeader title={customer.name} subtitle={customer.customer_no + ' \u2022 Total ' + rp(totalSpent) + ' \u2022 ' + orders.length + ' order'} action={<a className="btn" href="/customers">\u2190 Kembali</a>} />

      {/* Summary Cards */}
      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="glass rounded-2xl p-4"><p className="text-xs text-stone-500">Total Order</p><b className="text-xl">{orders.length}</b></div>
        <div className="glass rounded-2xl p-4"><p className="text-xs text-stone-500">Total Spent</p><b className="text-xl">{rp(totalSpent)}</b></div>
        <div className="glass rounded-2xl p-4"><p className="text-xs text-stone-500">Completed</p><b className="text-xl text-green-700">{completedOrders}</b></div>
        <div className="glass rounded-2xl p-4"><p className="text-xs text-stone-500">Avg / Order</p><b className="text-xl">{orders.length > 0 ? rp(totalSpent / orders.length) : '-'}</b></div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

        {/* Customer Info Sidebar */}
        <div className="glass rounded-3xl p-5 self-start">
          <h3 className="font-extrabold mb-3">Info Customer</h3>
          <div className="space-y-2 text-sm">
            <Info label="Customer No" value={customer.customer_no} />
            <Info label="Nama" value={customer.name} />
            <Info label="Phone" value={customer.phone} />
            <Info label="Email" value={customer.email} />
            <Info label="Channel Pertama" value={customer.sales_channels?.name} />
            <Info label="Bergabung" value={new Date(customer.created_at).toLocaleDateString('id-ID')} />
          </div>
        </div>

        {/* Order History Table */}
        <div className="glass rounded-3xl p-5">
          <h3 className="font-extrabold mb-3">Riwayat Transaksi</h3>
          {orders.length === 0 ? (
            <p className="text-sm text-stone-500 py-4">Belum ada transaksi.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500">
                    <th className="py-2">Order No</th>
                    <th>Channel</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Tanggal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o: Any) => (
                    <tr key={o.id} className="border-b border-white/60 hover:bg-white/30">
                      <td className="py-3 font-semibold">{o.order_no}</td>
                      <td><span className="pill text-xs">{o.sales_channels?.name || '-'}</span></td>
                      <td><span className={'pill ' + (o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : 'yellow')}>{o.status}</span></td>
                      <td className="font-semibold">{rp(o.grand_total)}</td>
                      <td className="text-xs text-stone-500">{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                      <td><a href={'/orders/' + o.id} className="text-brand text-xs hover:underline">Lihat</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
        </div>
      </div>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return <div><p className="label">{label}</p><p className="font-semibold text-stone-700">{value || '-'}</p></div>
}
