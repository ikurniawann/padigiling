'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ProductionStatus } from '@/types'

type Item = {
  id: string
  order_id: string
  order_no: string
  customer_name: string
  customer_address: string | null
  portion: number | null
  quantity: number
  notes: string | null
  production_status: ProductionStatus
}

type ProductGroup = {
  product_name: string
  total_quantity: number
  items: Item[]
}

type DateGroup = {
  event_date: string
  products: ProductGroup[]
}

const STATUS_CYCLE: ProductionStatus[] = ['pending', 'persiapan', 'memasak', 'done']

const STATUS_META: Record<ProductionStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: 'Belum mulai', bg: 'bg-stone-100',   text: 'text-stone-500',   dot: '⬜' },
  persiapan: { label: 'Persiapan',   bg: 'bg-blue-100',    text: 'text-blue-700',    dot: '🔵' },
  memasak:   { label: 'Memasak',     bg: 'bg-orange-100',  text: 'text-orange-700',  dot: '🟠' },
  done:      { label: 'Selesai',     bg: 'bg-emerald-100', text: 'text-emerald-700', dot: '✅' },
}

function nextStatus(current: ProductionStatus): ProductionStatus {
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

function fmtDate(d: string) {
  if (!d || d === 'no-date') return 'Tanpa Tanggal'
  try {
    const date = new Date(d + 'T00:00:00')
    if (isNaN(date.getTime())) return 'Tanpa Tanggal'
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return 'Tanpa Tanggal' }
}

export default function ProductionPage() {
  const [data, setData] = useState<DateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/production')
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setData(json.data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const cycleStatus = async (itemId: string, currentStatus: ProductionStatus) => {
    const next = nextStatus(currentStatus)
    setError('')

    setData(prev =>
      prev.map(dateGroup => ({
        ...dateGroup,
        products: dateGroup.products.map(product => ({
          ...product,
          items: product.items.map(item =>
            item.id === itemId ? { ...item, production_status: next } : item
          ),
        })),
      }))
    )
    setUpdating(prev => ({ ...prev, [itemId]: true }))

    try {
      const res = await fetch(`/api/production/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_status: next }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
    } catch (e: unknown) {
      await load()
      setError(e instanceof Error ? e.message : 'Gagal update status')
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const allExpanded = (group: DateGroup) =>
    group.products.every(p => expanded[`${group.event_date}-${p.product_name}`])

  const expandAll = (group: DateGroup) => {
    const next = { ...expanded }
    const expand = !allExpanded(group)
    group.products.forEach(p => { next[`${group.event_date}-${p.product_name}`] = expand })
    setExpanded(next)
  }

  return (
    <AppShell>
      <PageHeader
        title="Production Board"
        subtitle="Kelola status produksi tiap item order."
        action={
          <button className="btn" onClick={load}>↻ Refresh</button>
        }
      />

      {/* Status legend */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_CYCLE.map(s => {
          const m = STATUS_META[s]
          return (
            <span key={s} className={`flex items-center gap-1.5 rounded-full ${m.bg} ${m.text} px-3 py-1 text-xs font-semibold`}>
              <span>{m.dot}</span> {m.label}
            </span>
          )
        })}
        <span className="text-xs text-stone-400 self-center ml-1">Klik badge untuk ganti status</span>
      </div>

      {error && (
        <div className="mb-4 glass rounded-2xl p-4 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="glass rounded-3xl p-12 text-center text-stone-400">Memuat data produksi...</div>
      )}

      {!loading && data.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center text-stone-400">Tidak ada order yang perlu diproduksi.</div>
      )}

      <div className="space-y-6">
        {data.map(dateGroup => {
          const totalItems = dateGroup.products.reduce((s, p) => s + p.items.length, 0)
          const doneItems = dateGroup.products.reduce((s, p) => s + p.items.filter(i => i.production_status === 'done').length, 0)
          const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

          return (
            <div key={dateGroup.event_date} className="glass rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">📅 {fmtDate(dateGroup.event_date)}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">{doneItems}/{totalItems} selesai</span>
                  <div className="progress w-20"><i style={{ width: `${pct}%` }} /></div>
                  <button onClick={() => expandAll(dateGroup)} className="text-xs text-brand hover:underline">
                    {allExpanded(dateGroup) ? 'Tutup semua' : 'Buka semua'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {dateGroup.products.map(product => {
                  const key = `${dateGroup.event_date}-${product.product_name}`
                  const isOpen = expanded[key] ?? false
                  const done = product.items.filter(i => i.production_status === 'done').length
                  const productPct = product.items.length > 0 ? Math.round((done / product.items.length) * 100) : 0

                  // count by status
                  const counts = STATUS_CYCLE.reduce((acc, s) => {
                    acc[s] = product.items.filter(i => i.production_status === s).length
                    return acc
                  }, {} as Record<ProductionStatus, number>)

                  return (
                    <div key={key} className="rounded-2xl bg-white/50 border border-white/60 overflow-hidden">
                      <button
                        onClick={() => toggleExpand(key)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/40 transition-colors"
                      >
                        <span className="text-lg">{isOpen ? '▼' : '▶'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`font-bold text-base truncate ${done === product.items.length ? 'line-through text-stone-400' : ''}`}>
                              {product.product_name}
                            </span>
                            <span className="text-sm text-stone-500 shrink-0">×{product.total_quantity}</span>
                          </div>
                          <div className="mt-1 flex gap-3 text-xs flex-wrap">
                            {STATUS_CYCLE.map(s => counts[s] > 0 && (
                              <span key={s} className={`${STATUS_META[s].text} font-medium`}>
                                {STATUS_META[s].dot} {counts[s]}
                              </span>
                            ))}
                          </div>
                          <div className="progress mt-1"><i style={{ width: `${productPct}%` }} /></div>
                        </div>
                        <span className="pill shrink-0">{done}/{product.items.length}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-white/60 px-4 py-2 space-y-1.5">
                          {product.items.map(item => {
                            const meta = STATUS_META[item.production_status] ?? STATUS_META.pending
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${meta.bg} ${updating[item.id] ? 'opacity-50' : ''}`}
                              >
                                {/* Status cycle button */}
                                <button
                                  onClick={() => !updating[item.id] && cycleStatus(item.id, item.production_status)}
                                  disabled={updating[item.id]}
                                  className={`shrink-0 rounded-xl px-3 py-1 text-xs font-semibold ${meta.text} bg-white/70 hover:bg-white transition-colors border border-white/80 cursor-pointer`}
                                  title="Klik untuk ganti status"
                                >
                                  {meta.dot} {meta.label}
                                </button>

                                <span className="flex-1 min-w-0">
                                  <span className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-brand">{item.order_no}</span>
                                    <span className="text-stone-500">—</span>
                                    <span className={`font-medium ${item.production_status === 'done' ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                                      {item.customer_name}
                                    </span>
                                    <span className="text-stone-400">
                                      ({item.portion ? `${item.portion} porsi` : `${item.quantity} pcs`})
                                    </span>
                                  </span>
                                  {item.customer_address && (
                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                                      <span>📍</span>
                                      <span className="truncate">{item.customer_address}</span>
                                    </span>
                                  )}
                                  {item.notes && (
                                    <span className="mt-0.5 flex items-center gap-1 text-xs text-stone-500 italic">
                                      📝 {item.notes}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
