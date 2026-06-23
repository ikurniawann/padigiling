import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .select('*')
    .eq('product_id', params.id)
    .order('sort_order')
    .order('name')

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const { name, sku, price, portion, sort_order, is_active } = body
  if (!name?.trim()) return fail('name wajib diisi', 400)
  if (price == null || isNaN(Number(price))) return fail('price wajib diisi', 400)

  const { data, error } = await supabaseAdmin
    .from('product_variants')
    .insert({
      product_id: params.id,
      name: name.trim(),
      sku: sku?.trim() || null,
      price: Number(price),
      portion: portion ? Number(portion) : null,
      sort_order: sort_order ? Number(sort_order) : 0,
      is_active: is_active !== false,
    })
    .select('*')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data, 201)
}
