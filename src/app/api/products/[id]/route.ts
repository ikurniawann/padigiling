import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const { name, sku, category_id, base_price, base_portion, is_custom_price, is_active } = body

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim()
  if (sku !== undefined) updates.sku = sku?.trim() || null
  if (category_id !== undefined) updates.category_id = category_id || null
  if (base_price !== undefined) updates.base_price = Number(base_price)
  if (base_portion !== undefined) updates.base_portion = base_portion ? Number(base_portion) : null
  if (is_custom_price !== undefined) updates.is_custom_price = Boolean(is_custom_price)
  if (is_active !== undefined) updates.is_active = Boolean(is_active)
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', params.id)
    .select('*, product_categories(id, name, slug), product_variants(*)')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', params.id)

  if (error) return fail(error.message, 500, error)
  return ok({ id: params.id })
}
