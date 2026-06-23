import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*, product_categories(id, name, slug), product_variants(id, name, sku, price, portion, sort_order, is_active)')
    .order('name')

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const { name, sku, category_id, base_price, base_portion, is_custom_price, is_active } = body

  if (!name?.trim()) return fail('name wajib diisi', 400)
  if (base_price == null || isNaN(Number(base_price))) return fail('base_price wajib diisi', 400)

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: name.trim(),
      sku: sku?.trim() || null,
      category_id: category_id || null,
      base_price: Number(base_price),
      base_portion: base_portion ? Number(base_portion) : null,
      is_custom_price: Boolean(is_custom_price),
      is_active: is_active !== false,
    })
    .select('*, product_categories(id, name, slug), product_variants(*)')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data, 201)
}
