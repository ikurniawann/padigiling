import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const status = req.nextUrl.searchParams.get('status')

  let query = supabase
    .from('invoices')
    .select('*, orders(id, order_no, grand_total, status)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return fail('Gagal mengambil data invoice', 500)
  return ok(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.order_id) return fail('order_id is required')
  const payload = {
    order_id: body.order_id,
    invoice_no: body.invoice_no || null,
    platform: body.platform || 'paper_id',
    invoice_url: body.invoice_url || null,
    status: body.status || 'sent',
    amount: Number(body.amount || 0),
    sent_at: body.sent_at || new Date().toISOString(),
  }
  const { data, error } = await supabaseAdmin.from('invoices').insert(payload).select('*').single()
  if (error) return fail(error.message, 500, error)
  await supabaseAdmin.from('orders').update({ status: 'invoice_sent' }).eq('id', body.order_id)
  return ok(data, 201)
}
