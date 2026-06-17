import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'
import { cleanMasterPayload, getMasterConfig } from '@/lib/master-data'

export async function GET(req: NextRequest, { params }: { params: { module: string } }) {
  const config = getMasterConfig(params.module)
  if (!config) return fail('Invalid master data module', 404)

  const searchParams = req.nextUrl.searchParams
  const includeInactive = searchParams.get('include_inactive') === 'true'
  const q = searchParams.get('q')

  let query = supabaseAdmin.from(config.table).select('*')
  if (config.hasSort) query = query.order('sort_order', { ascending: true })
  query = query.order('name')
  const noActive = (config as Record<string,unknown>).noActiveFilter === true
  if (!includeInactive && !noActive) query = query.eq('is_active', true)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error } = await query
  if (error) return fail(error.message, 500, error)
  return ok(data || [])
}

export async function POST(req: NextRequest, { params }: { params: { module: string } }) {
  const config = getMasterConfig(params.module)
  if (!config) return fail('Invalid master data module', 404)

  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const payload = cleanMasterPayload(body, config)
  if (!payload.name) return fail('Name is required')
  if (!payload.code) return fail('Code is required')

  const { data, error } = await supabaseAdmin.from(config.table).insert(payload).select('*').single()
  if (error) return fail(error.message, 500, error)
  return ok(data, 201)
}
