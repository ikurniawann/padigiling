'use client'

import { useEffect, useState, useCallback } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'

type Item = {
  id: string
  order_id: string
  order_no: string
  customer_name: string
  portion: number | null
  quantity: number
  notes: string | null
  production_status: string
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

function fmtDate(d: string) {
  if (!d || d === 'no-date') return 'Tanpa Tanggal'
  try {
    const date = new Date(d + 'T00:00:00')
    if (isNaN(date.getTime())) return 'Tanpa Tanggal'
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleDone = async (itemId: string, currentStatus: string) => {
    const next = currentStatus === 'done' ? 'pending' : 'done'
    setUpdating((prev) => ({ ...prev, [itemId]: true }))

    try {
      const res = await fetch(`/api/production/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_status: next }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      // Refresh data
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal update status')
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const allExpanded = (group: DateGroup) => {
    return group.products.every((p) => expanded[`${group.event_date}-${p.product_name}`])
  }

  const expandAll = (group: DateGroup) => {
    const newExpanded = { ...expanded }
    const expand = !allExpanded(group)
    group.products.forEach((p) => {
      newExpanded[`${group.event_date}-${p.product_name}`] = expand
    })
    setExpanded(newExpanded)
  }

  return (
    <AppShell>
      <PageHeader
        title="Production Board"
        subtitle="Centang item yang sudah selesai diproduksi."
        action={
          <button className="btn" onClick={load}>
            ↻ Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-4 glass rounded-2xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="glass rounded-3xl p-12 text-center text-stone-400">
          Memuat data produksi...
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="glass rounded-3xl p-12 text-center text-stone-400">
          Tidak ada order yang perlu diproduksi saat ini.
        </div>
      )}

      <div className="space-y-6">
        {data.map((dateGroup) => {
          const totalItems = dateGroup.products.reduce((s, p) => s + p.items.length, 0)
          const doneItems = dateGroup.products.reduce((s, p) => s + p.items.filter(i => i.production_status === 'done').length, 0)
          const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

          return (
            <div key={dateGroup.event_date} className="glass rounded-3xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">
                  📅 {fmtDate(dateGroup.event_date)}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">
                    {doneItems}/{totalItems} selesai
                  </span>
                  <div className="progress w-20">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <button
                    onClick={() => expandAll(dateGroup)}
                    className="text-xs text-brand hover:underline"
                  >
                    {allExpanded(dateGroup) ? 'Tutup semua' : 'Buka semua'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {dateGroup.products.map((product) => {
                  const key = `${dateGroup.event_date}-${product.product_name}`
                  const isOpen = expanded[key] ?? false
                  const done = product.items.filter((i) => i.production_status === 'done').length
                  const pending = product.items.length - done
                  const productPct = product.items.length > 0 ? Math.round((done / product.items.length) * 100) : 0

                  return (
                    <div
                      key={key}
                      className="rounded-2xl bg-white/50 border border-white/60 overflow-hidden"
                    >
                      {/* Product header */}
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
                            <span className="text-sm text-stone-500 shrink-0">
                              ×{product.total_quantity}
                            </span>
                          </div>
                          <div className="mt-1 flex gap-2 text-xs text-stone-400">
                            <span>✅ {done}</span>
                            {pending > 0 && <span>⬜ {pending}</span>}
                          </div>
                          <div className="progress mt-1">
                            <i style={{ width: `${productPct}%` }} />
                          </div>
                        </div>
                        <span className="pill shrink-0">
                          {done}/{product.items.length}
                        </span>
                      </button>

                      {/* Expanded: checklist items */}
                      {isOpen && (
                        <div className="border-t border-white/60 px-4 py-2 space-y-1">
                          {product.items.map((item) => (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                item.production_status === 'done'
                                  ? 'bg-green-50 hover:bg-green-100'
                                  : 'hover:bg-white/60'
                              } ${updating[item.id] ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <input
                                type="checkbox"
                                className="w-5 h-5 accent-emerald-600 cursor-pointer shrink-0"
                                checked={item.production_status === 'done'}
                                onChange={() => toggleDone(item.id, item.production_status)}
                                disabled={updating[item.id]}
                              />
                              <span className="flex-1 min-w-0">
                                <span className="font-semibold text-xs text-brand">
                                  {item.order_no}
                                </span>
                                <span className="text-stone-500 mx-1">—</span>
                                <span className={`${item.production_status === 'done' ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                                  {item.customer_name}
                                </span>
                                <span className="text-stone-400 ml-1">
                                  ({item.portion ? `${item.portion} porsi` : `${item.quantity} pcs`})
                                </span>
                              </span>
                              {item.production_status === 'done' && (
                                <span className="text-xs text-emerald-600 font-semibold shrink-0">
                                  ✓ Selesai
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        )}
      </div>
    </AppShell>
  )
}
