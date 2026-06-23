'use client'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { rp } from '@/lib/format'

type Invoice = {
  id: string; invoice_no: string | null; platform: string
  invoice_url: string | null; status: string; amount: number
  sent_at: string | null; paid_at: string | null; created_at: string
  orders?: { id: string; order_no: string; grand_total: number; status: string } | null
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/invoices')
      const j = await r.json()
      if (j.error) throw new Error(j.error.message)
      setInvoices(j.data || [])
    } catch (e: any) { setMsg(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const statusPill = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'pill', sent: 'pill yellow', waiting_payment: 'pill yellow',
      paid: 'pill green', cancelled: 'pill red', expired: 'pill red',
    }
    return colors[status] || 'pill'
  }

  const totalAmount = invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const pendingCount = invoices.filter(i => ['draft', 'sent', 'waiting_payment'].includes(i.status)).length

  return (
    <AppShell>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice — tracking Paper.Id & pembayaran.`}
      />

      {/* Summary cards */}
      <section className="mb-4 grid gap-4 md:grid-cols-3">
        <div className="glass rounded-3xl p-4">
          <p className="text-xs text-stone-500">Total Invoice</p>
          <b className="text-xl">{rp(totalAmount)}</b>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-xs text-stone-500">Sudah Dibayar</p>
          <b className="text-xl text-green-700">{rp(paidAmount)}</b>
        </div>
        <div className="glass rounded-3xl p-4">
          <p className="text-xs text-stone-500">Pending</p>
          <b className="text-xl text-amber-700">{pendingCount} invoice</b>
        </div>
      </section>

      {/* Table */}
      <div className="glass rounded-3xl p-5">
        {loading && <span className="pill mb-3">Loading...</span>}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/70 text-left text-xs uppercase text-stone-500">
                <th className="py-2">Invoice</th>
                <th>Order</th>
                <th>Platform</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-white/60">
                  <td className="py-3">
                    <div className="font-semibold">{inv.invoice_no || '-'}</div>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" className="text-brand text-xs flex items-center gap-1 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Open Link
                      </a>
                    )}
                  </td>
                  <td>
                    <a href={inv.orders?.id ? `/orders/${inv.orders.id}` : '#'} className="text-brand hover:underline text-xs">
                      {inv.orders?.order_no || '-'}
                    </a>
                  </td>
                  <td><span className="pill">{inv.platform}</span></td>
                  <td>{rp(Number(inv.amount || 0))}</td>
                  <td><span className={statusPill(inv.status)}>{inv.status}</span></td>
                  <td className="text-xs text-stone-500">
                    {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!invoices.length && !loading && (
          <p className="py-6 text-center text-sm text-stone-500">Belum ada invoice.</p>
        )}
        {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
      </div>
    </AppShell>
  )
}
