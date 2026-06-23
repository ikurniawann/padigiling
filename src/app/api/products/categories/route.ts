import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .select('*')
    .order('sort_order')
    .order('name')

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const { name, description, sort_order, is_active } = body
  if (!name?.trim()) return fail('name wajib diisi', 400)

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      sort_order: sort_order ? Number(sort_order) : 0,
      is_active: is_active !== false,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return fail('Nama kategori sudah digunakan', 400)
    return fail(error.message, 500, error)
  }
  return ok(data, 201)
}
