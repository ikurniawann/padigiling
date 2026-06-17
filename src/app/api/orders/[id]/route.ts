import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, customers(*), sales_channels(*), order_items(*), deliveries(*), greeting_cards(*), invoices(*), payments(*), wa_order_parses(*)')
    .eq('id', params.id)
    .single()

  if (error) return fail(error.message, 404, error)
  return ok(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const allowed = [
    'status', 'event_date', 'event_time', 'order_type', 'subtotal', 'shipping_fee_customer',
    'shipping_fee_real', 'discount', 'grand_total', 'payment_status', 'production_status',
    'delivery_status', 'notes_customer', 'notes_internal'
  ]
  const payload = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))

  const { data, error } = await supabaseAdmin.from('orders').update(payload).eq('id', params.id).select('*').single()
  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}
