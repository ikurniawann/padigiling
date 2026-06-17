import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const stageId = req.nextUrl.searchParams.get('stage_id')
  const q = req.nextUrl.searchParams.get('q')

  let query = supabase
    .from('leads')
    .select('*, sales_channels(name,code), pipeline_stages(name,code), assigned_user:users(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (stageId) query = query.eq('pipeline_stage_id', stageId)
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return fail('Gagal mengambil data leads', 500)
  return ok(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.name) return fail('Nama lead wajib diisi', 400)

  const { data: stage } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id')
    .eq('code', body.stage_code || 'new')
    .maybeSingle()

  const { data: channel } = await supabaseAdmin
    .from('sales_channels')
    .select('id')
    .eq('code', body.channel_code || 'wa')
    .maybeSingle()

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      name: body.name,
      phone: body.phone || null,
      channel_id: channel?.id || null,
      pipeline_stage_id: stage?.id || null,
      inquiry_text: body.inquiry_text || null,
      need_date: body.need_date || null,
      follow_up_at: body.follow_up_at || null,
    })
    .select('*, sales_channels(name,code), pipeline_stages(name,code)')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data, 201)
}
