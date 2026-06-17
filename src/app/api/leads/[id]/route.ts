import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*, sales_channels(*), pipeline_stages(*), assigned_user:users(name), converted_customer:customers(*), converted_order:orders(order_no)')
    .eq('id', params.id)
    .single()

  if (error) return fail('Lead tidak ditemukan', 404)
  return ok(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body', 400)

  const allowed = [
    'name', 'phone', 'channel_id', 'pipeline_stage_id', 'assigned_user_id',
    'inquiry_text', 'need_date', 'follow_up_at', 'lost_reason',
    'converted_customer_id', 'converted_order_id',
  ]
  const payload = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update(payload)
    .eq('id', params.id)
    .select('*, sales_channels(name,code), pipeline_stages(name,code)')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('leads')
    .delete()
    .eq('id', params.id)

  if (error) return fail(error.message, 500, error)
  return ok({ deleted: true })
}
