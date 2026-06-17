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

const STATUS_ICON: Record<string, string> = {
  pending: '⬜',
  in_progress: '🔄',
  done: '✅',
}

const STATUS_NEXT: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'Progress',
  done: 'Selesai',
}

const STATUS_PILL: Record<string, string> = {
  pending: 'pill',
  in_progress: 'pill yellow',
  done: 'pill green',
}

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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

  const cycleStatus = async (itemId: string) => {
    const currentItem = data
      .flatMap((d) => d.products)
      .flatMap((p) => p.items)
      .find((i) => i.id === itemId)
    if (!currentItem) return

    const next = STATUS_NEXT[currentItem.production_status] || 'pending'
    setUpdating((prev) => ({ ...prev, [itemId]: true }))

    try {
      const res = await fetch(`/api/production/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ production_status: next }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)

      // Optimistic-like: refresh all data
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal update status')
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Production Board"
        subtitle="Tracking produksi per item — klik item untuk ganti status."
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
        {data.map((dateGroup) => (
          <div key={dateGroup.event_date} className="glass rounded-3xl p-5">
            <h3 className="mb-4 text-lg font-extrabold">
              📅 {fmtDate(dateGroup.event_date)}
            </h3>

            <div className="space-y-3">
              {dateGroup.products.map((product) => {
                const key = `${dateGroup.event_date}-${product.product_name}`
                const isOpen = expanded[key] ?? false

                // Count stats
                const done = product.items.filter((i) => i.production_status === 'done').length
                const progress = product.items.filter((i) => i.production_status === 'in_progress').length
                const pending = product.items.filter((i) => i.production_status === 'pending').length
                const pct = product.items.length > 0 ? Math.round((done / product.items.length) * 100) : 0

                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-white/50 border border-white/60 overflow-hidden"
                  >
                    {/* Product header — clickable */}
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/40 transition-colors"
                    >
                      <span className="text-lg">{isOpen ? '▼' : '▶'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-base truncate">
                            {product.product_name}
                          </span>
                          <span className="text-sm text-stone-500 shrink-0">
                            ×{product.total_quantity}
                          </span>
                        </div>
                        <div className="mt-1 flex gap-2 text-xs text-stone-400">
                          {done > 0 && <span>✅ {done}</span>}
                          {progress > 0 && <span>🔄 {progress}</span>}
                          {pending > 0 && <span>⬜ {pending}</span>}
                        </div>
                        <div className="progress mt-1">
                          <i style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className={`${STATUS_PILL[product.items.every(i => i.production_status === 'done') ? 'done' : product.items.some(i => i.production_status === 'in_progress') ? 'in_progress' : 'pending']} shrink-0`}>
                        {done}/{product.items.length}
                      </span>
                    </button>

                    {/* Expanded: individual items */}
                    {isOpen && (
                      <div className="border-t border-white/60 px-4 py-2 space-y-1">
                        {product.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => cycleStatus(item.id)}
                            disabled={updating[item.id]}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-left hover:bg-white/40 transition-colors disabled:opacity-50"
                          >
                            <span className="text-lg shrink-0">
                              {updating[item.id] ? '⏳' : STATUS_ICON[item.production_status] || '⬜'}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="font-semibold text-xs text-brand">
                                {item.order_no}
                              </span>
                              <span className="text-stone-500 mx-1">—</span>
                              <span className="text-stone-700">{item.customer_name}</span>
                              <span className="text-stone-400 ml-1">
                                ({item.portion ? `${item.portion} porsi` : `${item.quantity} pcs`})
                              </span>
                            </span>
                            <span className={`${STATUS_PILL[item.production_status] || 'pill'} shrink-0`}>
                              {STATUS_LABEL[item.production_status] || item.production_status}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
