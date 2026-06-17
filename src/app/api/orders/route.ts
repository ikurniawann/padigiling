import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/api-response'
import { createOrderSchema } from '@/lib/validations/order'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const status = req.nextUrl.searchParams.get('status')
  const q = req.nextUrl.searchParams.get('q')

  let query = supabase
    .from('orders')
    .select('*, customers(id,name,phone), sales_channels(id,name,code), order_items(*), deliveries(*), invoices(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)
  if (q) query = query.or(`order_no.ilike.%${q}%,notes_customer.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return fail('Gagal mengambil data order', 500)
  return ok(data || [])
}

export async function POST(req: NextRequest) {
  const rawBody = await req.json().catch(() => null)
  if (!rawBody) return fail('Invalid JSON body')

  // Validate input with Zod
  const parsed = createOrderSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return fail(`${firstError.path.join('.')}: ${firstError.message}`, 400)
  }

  const body = parsed.data
  const leadId = req.nextUrl.searchParams.get('lead_id') || null

  // Call RPC function — single database transaction
  const { data, error } = await supabaseAdmin.rpc('create_order_with_details', {
    p_customer_name: body.customer_name,
    p_customer_phone: body.customer_phone || null,
    p_channel_code: body.channel_code,
    p_order_type: body.order_type,
    p_status: body.status,
    p_subtotal: body.subtotal,
    p_shipping_fee_customer: body.shipping_fee_customer,
    p_shipping_fee_real: body.shipping_fee_real,
    p_discount: body.discount,
    p_order_text: body.order_text || null,
    p_quantity: body.quantity,
    p_item_notes: body.item_notes || null,
    p_recipient_name: body.recipient_name || null,
    p_recipient_phone: body.recipient_phone || null,
    p_address: body.address || null,
    p_courier: body.courier || null,
    p_greeting_card_message: body.greeting_card_message || null,
    p_raw_wa_text: body.raw_wa_text || null,
    p_parsed_json: body.parsed_json || rawBody,
    p_parser_type: body.parser_type,
    p_notes_internal: body.notes_internal || null,
    p_lead_id: leadId,
  })

  if (error) return fail(error.message, 500, error)
  return ok(data, 201)
}
