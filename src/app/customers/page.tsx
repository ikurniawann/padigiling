'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { rp } from '@/lib/format'

type Customer = {
  id: string; customer_no: string; name: string; phone: string; email: string
  created_at: string; sales_channels?: { name: string } | null
  orders?: { id: string; order_no: string; grand_total: number; created_at: string; status: string }[]
}

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([])
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      const r = await fetch('/api/customers')
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      setRows(j.data || [])
    } catch (e: any) { setMsg(e.message) }
  }

  useEffect(() => { load() }, [])

  const totalCustomers = rows.length

  return (
    <AppShell>
      <PageHeader title="Customers" subtitle={totalCustomers + ' customer terdaftar. Klik nama untuk lihat riwayat transaksi.'} />

      <div className="glass rounded-3xl p-5">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500">
                <th className="py-2">Customer</th>
                <th>Phone</th>
                <th>Channel</th>
                <th className="text-right">Total Spent</th>
                <th className="text-right">Orders</th>
                <th>Last Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const totalSpent = (c.orders || []).reduce((s, o) => s + Number(o.grand_total || 0), 0)
                const lastOrder = c.orders?.[0]
                return (
                  <tr key={c.id} className="border-b border-white/60 hover:bg-white/30">
                    <td className="py-3">
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-stone-500">{c.customer_no}</div>
                    </td>
                    <td className="text-stone-600">{c.phone || '-'}</td>
                    <td><span className="pill text-xs">{c.sales_channels?.name || '-'}</span></td>
                    <td className="text-right font-semibold text-stone-800">{rp(totalSpent)}</td>
                    <td className="text-right">{c.orders?.length || 0}</td>
                    <td className="text-xs">
                      {lastOrder ? (
                        <div>
                          <span className="font-semibold">{lastOrder.order_no}</span>
                          <br />
                          <span className="text-stone-500">{new Date(lastOrder.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <a href={'/customers/' + c.id} className="btn text-xs flex items-center gap-1">
                        Detail <ChevronRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="py-10 text-center text-sm text-stone-500">Belum ada customer. Order baru akan otomatis membuat customer.</p>}
        {msg && <p className="py-3 text-sm text-red-600">{msg}</p>}
      </div>
    </AppShell>
  )
}
