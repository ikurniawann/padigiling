'use client'

import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { pickLine, pickBlock, getWaTemplate } from '@/lib/wa-parser'
import { Product, ProductVariant } from '@/types'
import { Plus, X, Search, ShoppingCart, ChevronDown } from 'lucide-react'
import { rp } from '@/lib/format'
import { RpInput } from '@/components/RpInput'

type Option = { name: string; code: string }

type OrderLineItem = {
  key: string
  product_id: string | null
  product_name: string
  variant_id: string | null
  quantity: number
  unit_price: number
  portion: number | null
  notes: string
}

type Form = {
  customer_name: string
  customer_phone: string
  recipient_name: string
  recipient_phone: string
  delivery_date_text: string
  delivery_time_text: string
  address: string
  greeting_card_message: string
  channel_code: string
  order_type: string
  status: string
  payment_platform: string
  courier: string
  shipping_fee_customer: string
  shipping_fee_real: string
  discount: string
  notes_internal: string
  raw_wa_text: string
}

const initialForm: Form = {
  customer_name: '', customer_phone: '', recipient_name: '', recipient_phone: '',
  delivery_date_text: '', delivery_time_text: '', address: '', greeting_card_message: '',
  channel_code: 'wa', order_type: 'delivery', status: 'draft',
  payment_platform: 'paper_id', courier: 'gojek',
  shipping_fee_customer: '', shipping_fee_real: '', discount: '',
  notes_internal: '', raw_wa_text: '',
}

// ─── Product Browser ────────────────────────────────────────
type AddingState = {
  product: Product
  variant: ProductVariant | null
  quantity: number
  unit_price: number
  portion: string
  notes: string
}

function ProductBrowser({
  products,
  onAdd,
}: {
  products: Product[]
  onAdd: (item: Omit<OrderLineItem, 'key'>) => void
}) {
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<AddingState | null>(null)

  const filtered = products.filter(p =>
    p.is_active &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.product_categories?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  function openAdding(p: Product) {
    const firstVariant = p.product_variants?.find(v => v.is_active) ?? null
    setAdding({
      product: p,
      variant: firstVariant,
      quantity: 1,
      unit_price: firstVariant?.price ?? p.base_price,
      portion: String(firstVariant?.portion ?? p.base_portion ?? ''),
      notes: '',
    })
  }

  function selectVariant(v: ProductVariant) {
    if (!adding) return
    setAdding({
      ...adding,
      variant: v,
      unit_price: adding.product.is_custom_price ? adding.unit_price : v.price,
      portion: String(v.portion ?? adding.product.base_portion ?? ''),
    })
  }

  function confirmAdd() {
    if (!adding) return
    onAdd({
      product_id: adding.product.id,
      product_name: adding.variant
        ? `${adding.product.name} — ${adding.variant.name}`
        : adding.product.name,
      variant_id: adding.variant?.id ?? null,
      quantity: adding.quantity,
      unit_price: adding.unit_price,
      portion: adding.portion ? Number(adding.portion) : null,
      notes: adding.notes,
    })
    setAdding(null)
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 overflow-hidden">
      {/* Search */}
      <div className="flex items-center gap-2 border-b border-white/60 px-3 py-2.5">
        <Search size={15} className="text-stone-400 shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
          placeholder="Cari nama produk atau kategori..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        {search && <button onClick={() => setSearch('')}><X size={14} className="text-stone-400" /></button>}
      </div>

      {/* Product list */}
      <div className="max-h-64 overflow-y-auto divide-y divide-white/40">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-stone-400">Tidak ada produk ditemukan.</p>
        )}
        {filtered.map(p => {
          const isOpen = adding?.product.id === p.id
          const variants = p.product_variants?.filter(v => v.is_active) ?? []
          return (
            <div key={p.id}>
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{p.name}</span>
                    {p.product_categories?.name && (
                      <span className="rounded-full bg-brand-soft text-brand text-[11px] font-semibold px-2 py-0.5">
                        {p.product_categories.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500">
                    {p.is_custom_price ? 'Harga custom' : rp(p.base_price)}
                    {variants.length > 0 && ` · ${variants.length} varian`}
                  </span>
                </div>
                <button
                  onClick={() => isOpen ? setAdding(null) : openAdding(p)}
                  className={`shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${isOpen ? 'bg-brand text-white' : 'bg-brand-soft text-brand hover:bg-brand hover:text-white'}`}
                >
                  {isOpen ? <ChevronDown size={13} /> : <Plus size={13} />}
                  {isOpen ? 'Tutup' : 'Tambah'}
                </button>
              </div>

              {/* Inline add form */}
              {isOpen && adding && (
                <div className="bg-white/60 border-t border-white/60 px-4 py-3 space-y-3">
                  {/* Variant selector */}
                  {variants.length > 0 && (
                    <div>
                      <label className="label">Varian</label>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map(v => (
                          <button
                            key={v.id}
                            onClick={() => selectVariant(v)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${adding.variant?.id === v.id ? 'bg-brand text-white' : 'bg-white text-stone-600 border border-stone-200 hover:border-brand hover:text-brand'}`}
                          >
                            {v.name} {!adding.product.is_custom_price && `· ${rp(v.price)}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    {/* Price */}
                    <div>
                      <label className="label">Harga (Rp)</label>
                      <RpInput
                        className="input text-sm"
                        value={adding.unit_price}
                        onChange={n => setAdding({ ...adding, unit_price: n })}
                        readOnly={!adding.product.is_custom_price && variants.length === 0}
                      />
                    </div>
                    {/* Quantity */}
                    <div>
                      <label className="label">Qty</label>
                      <input
                        className="input text-sm"
                        type="number"
                        min={1}
                        value={adding.quantity}
                        onChange={e => setAdding({ ...adding, quantity: Math.max(1, Number(e.target.value)) })}
                      />
                    </div>
                    {/* Portion */}
                    <div>
                      <label className="label">Porsi</label>
                      <input
                        className="input text-sm"
                        type="number"
                        placeholder="-"
                        value={adding.portion}
                        onChange={e => setAdding({ ...adding, portion: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Catatan Item</label>
                    <input
                      className="input text-sm"
                      placeholder="Opsional"
                      value={adding.notes}
                      onChange={e => setAdding({ ...adding, notes: e.target.value })}
                    />
                  </div>

                  {/* Subtotal preview + confirm */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-600">
                      {adding.quantity} × {rp(adding.unit_price)} = <b className="text-brand">{rp(adding.quantity * adding.unit_price)}</b>
                    </span>
                    <button
                      onClick={confirmAdd}
                      className="btn btn-primary text-xs py-1.5 px-4"
                    >
                      + Tambah ke Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Order Items List ────────────────────────────────────────
function OrderItemsList({
  items,
  onChange,
  onRemove,
}: {
  items: OrderLineItem[]
  onChange: (key: string, field: keyof OrderLineItem, value: string | number) => void
  onRemove: (key: string) => void
}) {
  if (items.length === 0) return null

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 overflow-hidden">
      <div className="divide-y divide-white/40">
        {items.map((item, i) => (
          <div key={item.key} className="flex items-center gap-2 px-3 py-2.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-brand text-white text-[10px] font-bold shrink-0">{i + 1}</span>
            <span className="flex-1 min-w-0 text-sm font-medium truncate">{item.product_name}</span>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={e => onChange(item.key, 'quantity', Number(e.target.value))}
              className="w-12 rounded-lg border border-stone-200 bg-white px-2 py-1 text-center text-sm focus:outline-none focus:border-brand"
            />
            <span className="text-xs text-stone-500 w-24 text-right shrink-0">{rp(item.unit_price * item.quantity)}</span>
            <button onClick={() => onRemove(item.key)} className="text-stone-300 hover:text-red-500 transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="border-t border-white/60 flex justify-between items-center px-4 py-3 bg-white/40">
        <span className="text-xs text-stone-500">{items.length} item</span>
        <span className="text-sm font-bold">Subtotal: <span className="text-brand">{rp(subtotal)}</span></span>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
function CreateOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead_id')

  const [form, setForm] = useState<Form>(initialForm)
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([])
  const [showBrowser, setShowBrowser] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [opts, setOpts] = useState<Record<string, Option[]>>({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    const masterKeys: Record<string, string> = {
      channel_code: 'sales_channels', order_type: 'order_types',
      status: 'order_statuses', payment_platform: 'payment_platforms', courier: 'couriers',
    }
    const [masterEntries, productsRes] = await Promise.all([
      Promise.all(Object.entries(masterKeys).map(async ([key, module]) => {
        const r = await fetch(`/api/master-data/${module}`)
        const j = await r.json()
        return [key, j.data || []] as [string, Option[]]
      })),
      fetch('/api/products').then(r => r.json()),
    ])
    setOpts(Object.fromEntries(masterEntries))
    setProducts(productsRes.data || [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Pre-fill from lead
  useEffect(() => {
    const name = searchParams.get('name')
    const phone = searchParams.get('phone')
    const inquiry = searchParams.get('inquiry')
    const needDate = searchParams.get('need_date')
    if (name || phone || inquiry || needDate) {
      setForm(f => ({
        ...f,
        customer_name: name || f.customer_name,
        customer_phone: phone || f.customer_phone,
        recipient_name: name || f.recipient_name,
        delivery_date_text: needDate || f.delivery_date_text,
      }))
      if (leadId) setMsg('Membuat order dari Lead — data sudah terisi otomatis.')
    }
  }, [searchParams, leadId])

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  // WA parser
  function parse() {
    const raw = form.raw_wa_text
    setForm(f => ({
      ...f,
      customer_name: pickLine(raw, ['Nama pemesan', 'Nama Pemesan']) || f.customer_name,
      customer_phone: pickLine(raw, ['No telp', 'No telp pemesan', 'No HP pemesan']) || f.customer_phone,
      recipient_name: pickLine(raw, ['Nama Penerima', 'Nama penerima']) || f.recipient_name,
      recipient_phone: pickLine(raw, ['No Telp penerima', 'No telp penerima', 'No HP penerima']) || f.recipient_phone,
      delivery_date_text: pickLine(raw, ['Delivery/pick up tgl', 'Delivery tgl', 'Pick up tgl', 'Tanggal']) || f.delivery_date_text,
      delivery_time_text: pickLine(raw, ['Jam']) || f.delivery_time_text,
      address: pickBlock(raw, ['Alamat'], ['Apakah perlu kartu ucapan', 'Mohon ditulis disini']) || f.address,
      greeting_card_message: pickBlock(raw, ['Apakah perlu kartu ucapan', 'Mohon ditulis disini'], []) || f.greeting_card_message,
    }))
    setMsg('Data berhasil di-generate. Silakan tambahkan produk dan review sebelum buat order.')
  }

  // Order items management
  function addItem(item: Omit<OrderLineItem, 'key'>) {
    setOrderItems(prev => [...prev, { ...item, key: `${Date.now()}-${Math.random()}` }])
    setShowBrowser(false)
  }

  function removeItem(key: string) {
    setOrderItems(prev => prev.filter(i => i.key !== key))
  }

  function updateItem(key: string, field: keyof OrderLineItem, value: string | number) {
    setOrderItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
  }

  const subtotal = orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const grandTotal = subtotal + Number(form.shipping_fee_customer || 0) - Number(form.discount || 0)

  async function save() {
    if (!form.customer_name.trim()) { setMsg('Nama customer wajib diisi'); return }
    if (orderItems.length === 0) { setMsg('Tambahkan minimal 1 produk'); return }
    setLoading(true)
    setMsg('Menyimpan order...')
    try {
      const url = leadId ? `/api/orders?lead_id=${leadId}` : '/api/orders'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          subtotal,
          shipping_fee_customer: Number(form.shipping_fee_customer || 0),
          shipping_fee_real: Number(form.shipping_fee_real || 0),
          discount: Number(form.discount || 0),
          quantity: orderItems.reduce((s, i) => s + i.quantity, 0),
          order_items: orderItems.map(({ key: _, ...item }) => item),
          parsed_json: form,
        }),
      })
      const j = await res.json()
      if (j.error) throw new Error(j.error.message)
      setMsg(`Order berhasil dibuat: ${j.data.order.order_no}`)
      setTimeout(() => router.push('/orders'), 800)
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Gagal membuat order')
    } finally {
      setLoading(false)
    }
  }

  const selectField = (key: keyof Form, label: string) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" value={form[key]} onChange={e => set(key, e.target.value as Form[keyof Form])}>
        {(opts[key] || []).map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
    </div>
  )

  return (
    <AppShell>
      {leadId && (
        <div className="mb-4 glass rounded-2xl p-3 text-sm text-brand font-semibold">
          🔄 Membuat order dari Lead — data sudah terisi otomatis.
        </div>
      )}

      <PageHeader
        title="Create Order"
        subtitle="Isi data customer, pilih produk dari katalog, lalu buat order."
        action={
          <div className="flex gap-2">
            <button className="btn" onClick={async () => { await navigator.clipboard?.writeText(getWaTemplate()); setMsg('Template WA berhasil di-copy.') }}>
              Copy Template WA
            </button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {/* ── Left: WA Parser ── */}
        <section className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-extrabold">Paste WhatsApp</h3>
            <span className="pill">Auto Parser</span>
          </div>
          <textarea
            className="input min-h-72"
            value={form.raw_wa_text}
            onChange={e => set('raw_wa_text', e.target.value)}
            placeholder="Paste format pemesanan customer di sini..."
          />
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary" onClick={parse}>Generate ke Field</button>
            <button className="btn" onClick={() => { setForm(initialForm); setOrderItems([]) }}>Reset</button>
          </div>
          <div className="mt-4 rounded-2xl bg-white/60 p-4 text-sm text-stone-600">
            <b>Flow:</b><br />
            1. Paste WA → Generate<br />
            2. Tambah produk dari katalog<br />
            3. Review & buat order
          </div>
        </section>

        {/* ── Right: Order Form ── */}
        <section className="glass rounded-3xl p-5">
          <h3 className="mb-4 font-extrabold">Data Order</h3>

          <div className="space-y-5">
            {/* Customer */}
            <div className="grid gap-3 grid-cols-2">
              <div>
                <label className="label">Nama Pemesan *</label>
                <input className="input" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
              </div>
              <div>
                <label className="label">No Telp Pemesan</label>
                <input className="input" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Nama Penerima</label>
                <input className="input" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} />
              </div>
              <div>
                <label className="label">No Telp Penerima</label>
                <input className="input" value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value)} />
              </div>
            </div>

            {/* Channel + Type */}
            <div className="grid gap-3 grid-cols-2">
              {selectField('channel_code', 'Channel')}
              {selectField('order_type', 'Delivery / Pick Up')}
              <div>
                <label className="label">Tanggal Delivery</label>
                <input className="input" value={form.delivery_date_text} onChange={e => set('delivery_date_text', e.target.value)} />
              </div>
              <div>
                <label className="label">Jam</label>
                <input className="input" value={form.delivery_time_text} onChange={e => set('delivery_time_text', e.target.value)} />
              </div>
            </div>

            {/* ── Products Section ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0 flex items-center gap-1.5">
                  <ShoppingCart size={14} /> Produk yang Dipesan *
                </label>
                <button
                  onClick={() => setShowBrowser(b => !b)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${showBrowser ? 'bg-stone-100 text-stone-600' : 'bg-brand-soft text-brand hover:bg-brand hover:text-white'}`}
                >
                  {showBrowser ? <X size={13} /> : <Plus size={13} />}
                  {showBrowser ? 'Tutup' : 'Tambah Produk'}
                </button>
              </div>

              {showBrowser && (
                <div className="mb-3">
                  <ProductBrowser products={products} onAdd={addItem} />
                </div>
              )}

              <OrderItemsList items={orderItems} onChange={updateItem} onRemove={removeItem} />

              {orderItems.length === 0 && !showBrowser && (
                <p className="py-3 text-center text-sm text-stone-400 rounded-2xl border border-dashed border-stone-200">
                  Belum ada produk — klik "Tambah Produk"
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="label">Alamat Pengiriman</label>
              <textarea className="input min-h-16" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>

            {/* Pricing */}
            <div className="grid gap-3 grid-cols-2">
              {selectField('payment_platform', 'Platform Pembayaran')}
              {selectField('status', 'Status Awal')}
              {selectField('courier', 'Courier')}
              <div>
                <label className="label">Ongkir Customer (Rp)</label>
                <RpInput value={form.shipping_fee_customer} onChange={n => set('shipping_fee_customer', n > 0 ? String(n) : '')} />
              </div>
              <div>
                <label className="label">Ongkir Real (Rp)</label>
                <RpInput value={form.shipping_fee_real} onChange={n => set('shipping_fee_real', n > 0 ? String(n) : '')} />
              </div>
              <div>
                <label className="label">Diskon (Rp)</label>
                <RpInput value={form.discount} onChange={n => set('discount', n > 0 ? String(n) : '')} />
              </div>
            </div>

            {/* Grand total preview */}
            {orderItems.length > 0 && (
              <div className="rounded-2xl bg-brand-soft px-4 py-3 text-sm">
                <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{rp(subtotal)}</span></div>
                {Number(form.shipping_fee_customer) > 0 && <div className="flex justify-between text-stone-600"><span>Ongkir</span><span>+{rp(Number(form.shipping_fee_customer))}</span></div>}
                {Number(form.discount) > 0 && <div className="flex justify-between text-stone-600"><span>Diskon</span><span>−{rp(Number(form.discount))}</span></div>}
                <div className="flex justify-between font-extrabold text-brand mt-1 pt-1 border-t border-brand/20"><span>Grand Total</span><span>{rp(grandTotal)}</span></div>
              </div>
            )}

            {/* Kartu ucapan */}
            <div>
              <label className="label">Kartu Ucapan / Catatan Customer</label>
              <textarea className="input min-h-16" value={form.greeting_card_message} onChange={e => set('greeting_card_message', e.target.value)} />
            </div>
            <div>
              <label className="label">Catatan Internal</label>
              <textarea className="input min-h-12" value={form.notes_internal} onChange={e => set('notes_internal', e.target.value)} />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-1">
              <button className="btn btn-primary flex-1" disabled={loading} onClick={save}>
                {loading ? 'Menyimpan...' : 'Buat Order'}
              </button>
            </div>
            {msg && <p className="text-sm text-stone-600 mt-1">{msg}</p>}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default function CreateOrder() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Loading...</div>}>
      <CreateOrderContent />
    </Suspense>
  )
}
