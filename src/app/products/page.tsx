'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { Product, ProductCategory, ProductVariant } from '@/types'
import { Pencil, Trash2, Plus, Tag, Package, ChevronDown, ChevronRight, X } from 'lucide-react'
import { rp } from '@/lib/format'
import { RpInput } from '@/components/RpInput'

type Tab = 'products' | 'categories'

const emptyProductForm = {
  name: '', sku: '', category_id: '', base_price: '', base_portion: '',
  is_custom_price: false, is_active: true,
}
const emptyCategoryForm = {
  name: '', description: '', sort_order: '0', is_active: true,
}
const emptyVariantForm = { name: '', sku: '', price: '', portion: '', is_active: true }

function CategoryCombobox({
  categories,
  value,
  onChange,
  onCreated,
}: {
  categories: ProductCategory[]
  value: string
  onChange: (id: string) => void
  onCreated: (cat: ProductCategory) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedName = categories.find(c => c.id === value)?.name ?? ''
  const q = query.trim()
  const filtered = q.length === 0
    ? categories
    : categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
  const canCreate = q.length >= 3 && !categories.some(c => c.name.toLowerCase() === q.toLowerCase())

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function createCategory() {
    setCreating(true)
    try {
      const res = await fetch('/api/products/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: q, sort_order: 0 }),
      })
      const json = await res.json()
      if (!json.error) {
        onCreated(json.data)
        onChange(json.data.id)
        setQuery('')
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          className="input pr-7"
          placeholder="Cari kategori..."
          value={open ? query : selectedName}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={e => setQuery(e.target.value)}
        />
        {selectedName && !open && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-red-400 transition-colors"
            onClick={() => { onChange(''); setQuery('') }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl bg-white shadow-2xl border border-stone-100 max-h-52 overflow-y-auto">
          {filtered.length === 0 && q.length < 3 && (
            <p className="px-3 py-2.5 text-xs text-stone-400">
              {categories.length === 0 ? 'Belum ada kategori.' : 'Ketik minimal 3 huruf untuk buat baru.'}
            </p>
          )}
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-stone-50 transition-colors first:rounded-t-2xl"
              onClick={() => { onChange(c.id); setQuery(''); setOpen(false) }}
            >
              {c.name}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              disabled={creating}
              className="w-full text-left px-3 py-2.5 text-sm text-brand font-semibold flex items-center gap-2 hover:bg-brand-soft transition-colors border-t border-stone-100 last:rounded-b-2xl"
              onClick={createCategory}
            >
              <Plus size={13} />
              {creating ? 'Menyimpan...' : `Tambah "${q}"`}
            </button>
          )}
          {q.length >= 3 && filtered.length === 0 && !canCreate && (
            <p className="px-3 py-2.5 text-xs text-stone-400">Tidak ditemukan.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Product panel
  const [showPanel, setShowPanel] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ ...emptyProductForm })
  const [saving, setSaving] = useState(false)

  // Category panel
  const [showCatPanel, setShowCatPanel] = useState(false)
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null)
  const [catForm, setCatForm] = useState({ ...emptyCategoryForm })

  // Variant add form (inline per product)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState({ ...emptyVariantForm })
  const [addingVariantFor, setAddingVariantFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/products/categories').then(r => r.json()),
      ])
      if (pRes.error) throw new Error(pRes.error.message)
      if (cRes.error) throw new Error(cRes.error.message)
      setProducts(pRes.data ?? [])
      setCategories(cRes.data ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // --- Product CRUD ---
  function openCreateProduct() {
    setEditProduct(null)
    setProductForm({ ...emptyProductForm })
    setShowPanel(true)
  }

  function openEditProduct(p: Product) {
    setEditProduct(p)
    setProductForm({
      name: p.name,
      sku: p.sku ?? '',
      category_id: p.category_id ?? '',
      base_price: String(p.base_price),
      base_portion: p.base_portion ? String(p.base_portion) : '',
      is_custom_price: p.is_custom_price,
      is_active: p.is_active,
    })
    setShowPanel(true)
  }

  async function saveProduct() {
    if (!productForm.name.trim()) { setError('Nama produk wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || null,
        category_id: productForm.category_id || null,
        base_price: Number(productForm.base_price),
        base_portion: productForm.base_portion ? Number(productForm.base_portion) : null,
        is_custom_price: productForm.is_custom_price,
        is_active: productForm.is_active,
      }
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products'
      const method = editProduct ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setShowPanel(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return
    setError('')
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  // --- Category CRUD ---
  function openCreateCategory() {
    setEditCategory(null)
    setCatForm({ ...emptyCategoryForm })
    setShowCatPanel(true)
  }

  function openEditCategory(c: ProductCategory) {
    setEditCategory(c)
    setCatForm({ name: c.name, description: c.description ?? '', sort_order: String(c.sort_order), is_active: c.is_active })
    setShowCatPanel(true)
  }

  async function saveCategory() {
    if (!catForm.name.trim()) { setError('Nama kategori wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const url = editCategory ? `/api/products/categories/${editCategory.id}` : '/api/products/categories'
      const method = editCategory ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catForm.name, description: catForm.description, sort_order: catForm.sort_order, is_active: catForm.is_active }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setShowCatPanel(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Hapus kategori "${name}"?`)) return
    setError('')
    try {
      const res = await fetch(`/api/products/categories/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  // --- Variant CRUD ---
  async function addVariant(productId: string) {
    if (!variantForm.name.trim()) return
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: variantForm.name, sku: variantForm.sku, price: Number(variantForm.price), portion: variantForm.portion ? Number(variantForm.portion) : null, is_active: variantForm.is_active }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      setAddingVariantFor(null)
      setVariantForm({ ...emptyVariantForm })
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menambah varian')
    }
  }

  async function deleteVariant(variantId: string) {
    if (!confirm('Hapus varian ini?')) return
    setError('')
    try {
      const res = await fetch(`/api/products/variants/${variantId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) throw new Error(json.error.message)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus varian')
    }
  }

  function handleCategoryCreated(cat: ProductCategory) {
    setCategories(prev => [...prev, cat])
  }

  // --- Helpers ---
  function categoryName(id: string | null) {
    if (!id) return null
    return categories.find(c => c.id === id)?.name ?? null
  }

  const productCount = (catId: string) => products.filter(p => p.category_id === catId).length

  return (
    <AppShell>
      <PageHeader
        title="Manajemen Produk"
        subtitle="Kelola kategori, produk, dan varian."
        action={
          <button className="btn btn-primary" onClick={tab === 'products' ? openCreateProduct : openCreateCategory}>
            <Plus size={15} /> {tab === 'products' ? 'Tambah Produk' : 'Tambah Kategori'}
          </button>
        }
      />

      {error && (
        <div className="mb-4 glass rounded-2xl p-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-2xl bg-white/60 p-1 w-fit border border-white/60">
        {(['products', 'categories'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${t === tab ? 'bg-brand text-white shadow' : 'text-stone-500 hover:text-brand'}`}
          >
            {t === 'products' ? <Package size={15} /> : <Tag size={15} />}
            {t === 'products' ? `Produk (${products.length})` : `Kategori (${categories.length})`}
          </button>
        ))}
      </div>

      {loading && <div className="glass rounded-3xl p-12 text-center text-stone-400">Memuat data...</div>}

      {/* ===== PRODUCTS TAB ===== */}
      {!loading && tab === 'products' && (
        <div className="space-y-3">
          {products.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center text-stone-400">Belum ada produk. Klik "Tambah Produk" untuk mulai.</div>
          )}
          {products.map(p => {
            const variants: ProductVariant[] = p.product_variants ?? []
            const isExpanded = expandedProduct === p.id
            return (
              <div key={p.id} className="glass rounded-3xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="text-stone-400 hover:text-brand transition-colors">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-stone-800">{p.name}</span>
                      {p.sku && <span className="text-xs text-stone-400">#{p.sku}</span>}
                      {categoryName(p.category_id) && (
                        <span className="rounded-full bg-brand-soft text-brand text-xs font-semibold px-2 py-0.5">{categoryName(p.category_id)}</span>
                      )}
                      {p.is_custom_price && (
                        <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5">Harga Custom</span>
                      )}
                      {!p.is_active && (
                        <span className="rounded-full bg-stone-100 text-stone-400 text-xs font-semibold px-2 py-0.5">Nonaktif</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-stone-500">
                      <span>{p.is_custom_price ? 'Harga ditentukan saat order' : rp(p.base_price)}</span>
                      {p.base_portion && <span>· {p.base_portion} porsi</span>}
                      <span>· {variants.length} varian</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEditProduct(p)} className="btn text-xs py-1.5 px-3">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => deleteProduct(p.id, p.name)} className="btn text-xs py-1.5 px-3 text-red-600 hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Variants section */}
                {isExpanded && (
                  <div className="border-t border-white/60 px-5 py-4 bg-white/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-stone-600">Varian</span>
                      <button
                        className="btn text-xs py-1 px-3"
                        onClick={() => { setAddingVariantFor(addingVariantFor === p.id ? null : p.id); setVariantForm({ ...emptyVariantForm }) }}
                      >
                        <Plus size={13} /> Tambah Varian
                      </button>
                    </div>

                    {variants.length === 0 && addingVariantFor !== p.id && (
                      <p className="text-sm text-stone-400 py-2">Belum ada varian.</p>
                    )}

                    <div className="space-y-2">
                      {variants.map((v: ProductVariant) => (
                        <div key={v.id} className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5 text-sm">
                          <div>
                            <span className="font-semibold">{v.name}</span>
                            {v.sku && <span className="text-xs text-stone-400 ml-2">#{v.sku}</span>}
                            {!v.is_active && <span className="ml-2 text-xs text-stone-400">(nonaktif)</span>}
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-brand">{rp(v.price)}</span>
                            {v.portion && <span className="text-xs text-stone-400">{v.portion} porsi</span>}
                            <button onClick={() => deleteVariant(v.id)} className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add variant form */}
                    {addingVariantFor === p.id && (
                      <div className="mt-3 rounded-2xl bg-white/70 border border-white/60 p-4">
                        <p className="text-sm font-semibold mb-3">Tambah Varian</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="label">Nama Varian *</label>
                            <input className="input" placeholder="mis. Ukuran Kecil" value={variantForm.name} onChange={e => setVariantForm(f => ({ ...f, name: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">SKU</label>
                            <input className="input" placeholder="Opsional" value={variantForm.sku} onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))} />
                          </div>
                          <div>
                            <label className="label">Harga *</label>
                            <RpInput value={variantForm.price} onChange={n => setVariantForm(f => ({ ...f, price: n > 0 ? String(n) : '' }))} />
                          </div>
                          <div>
                            <label className="label">Porsi</label>
                            <input className="input" type="number" placeholder="Opsional" value={variantForm.portion} onChange={e => setVariantForm(f => ({ ...f, portion: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-primary text-xs" onClick={() => addVariant(p.id)}>Simpan</button>
                          <button className="btn text-xs" onClick={() => { setAddingVariantFor(null); setVariantForm({ ...emptyVariantForm }) }}>Batal</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ===== CATEGORIES TAB ===== */}
      {!loading && tab === 'categories' && (
        <div className="space-y-3">
          {categories.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center text-stone-400">Belum ada kategori.</div>
          )}
          {categories.map(c => (
            <div key={c.id} className="glass rounded-2xl flex items-center gap-4 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Tag size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-xs text-stone-400">/{c.slug}</span>
                  {!c.is_active && <span className="rounded-full bg-stone-100 text-stone-400 text-xs px-2 py-0.5">Nonaktif</span>}
                </div>
                {c.description && <p className="text-sm text-stone-500 mt-0.5">{c.description}</p>}
                <p className="text-xs text-stone-400 mt-0.5">{productCount(c.id)} produk</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEditCategory(c)} className="btn text-xs py-1.5 px-3"><Pencil size={13} /> Edit</button>
                <button onClick={() => deleteCategory(c.id, c.name)} className="btn text-xs py-1.5 px-3 text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== PRODUCT PANEL ===== */}
      {showPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <aside className="w-[420px] overflow-y-auto bg-white/90 backdrop-blur-2xl shadow-2xl border-l border-white/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold">{editProduct ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={() => setShowPanel(false)}><X size={20} className="text-stone-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nama Produk *</label>
                <input className="input" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama produk" />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} placeholder="Kode produk (opsional)" />
              </div>
              <div>
                <label className="label">Kategori</label>
                <CategoryCombobox
                  categories={categories}
                  value={productForm.category_id}
                  onChange={id => setProductForm(f => ({ ...f, category_id: id }))}
                  onCreated={handleCategoryCreated}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Harga Dasar (Rp)</label>
                  <RpInput value={productForm.base_price} onChange={n => setProductForm(f => ({ ...f, base_price: n > 0 ? String(n) : '' }))} disabled={productForm.is_custom_price} />
                </div>
                <div>
                  <label className="label">Porsi Dasar</label>
                  <input className="input" type="number" value={productForm.base_portion} onChange={e => setProductForm(f => ({ ...f, base_portion: e.target.value }))} placeholder="Opsional" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setProductForm(f => ({ ...f, is_custom_price: !f.is_custom_price }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${productForm.is_custom_price ? 'bg-brand' : 'bg-stone-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${productForm.is_custom_price ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium">Harga Custom (diinput saat order)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => setProductForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${productForm.is_active ? 'bg-brand' : 'bg-stone-200'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${productForm.is_active ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium">Produk Aktif</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn btn-primary flex-1" onClick={saveProduct} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button className="btn flex-1" onClick={() => setShowPanel(false)}>Batal</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ===== CATEGORY PANEL ===== */}
      {showCatPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setShowCatPanel(false)} />
          <aside className="w-[380px] overflow-y-auto bg-white/90 backdrop-blur-2xl shadow-2xl border-l border-white/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold">{editCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setShowCatPanel(false)}><X size={20} className="text-stone-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nama Kategori *</label>
                <input className="input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="mis. Kue Ulang Tahun" />
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <textarea className="input" rows={2} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="Opsional" />
              </div>
              <div>
                <label className="label">Urutan</label>
                <input className="input" type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: e.target.value }))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setCatForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${catForm.is_active ? 'bg-brand' : 'bg-stone-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${catForm.is_active ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium">Kategori Aktif</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button className="btn btn-primary flex-1" onClick={saveCategory} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button className="btn flex-1" onClick={() => setShowCatPanel(false)}>Batal</button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  )
}
