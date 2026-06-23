import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const { name, description, sort_order, is_active } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) {
    updates.name = name.trim()
    updates.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  if (description !== undefined) updates.description = description?.trim() || null
  if (sort_order !== undefined) updates.sort_order = Number(sort_order)
  if (is_active !== undefined) updates.is_active = Boolean(is_active)

  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', params.id)

  if ((count ?? 0) > 0) return fail(`Kategori masih digunakan oleh ${count} produk`, 400)

  const { error } = await supabaseAdmin
    .from('product_categories')
    .delete()
    .eq('id', params.id)

  if (error) return fail(error.message, 500, error)
  return ok({ id: params.id })
}
