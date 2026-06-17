import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'
import { cleanMasterPayload, getMasterConfig } from '@/lib/master-data'

export async function GET(_req: NextRequest, { params }: { params: { module: string; id: string } }) {
  const config = getMasterConfig(params.module)
  if (!config) return fail('Invalid master data module', 404)

  const { data, error } = await supabaseAdmin.from(config.table).select('*').eq('id', params.id).single()
  if (error) return fail(error.message, 404, error)
  return ok(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { module: string; id: string } }) {
  const config = getMasterConfig(params.module)
  if (!config) return fail('Invalid master data module', 404)

  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const payload = cleanMasterPayload(body, config)
  if (!payload.name) return fail('Name is required')
  if (!payload.code) return fail('Code is required')

  const { data, error } = await supabaseAdmin.from(config.table).update(payload).eq('id', params.id).select('*').single()
  if (error) return fail(error.message, 500, error)
  return ok(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { module: string; id: string } }) {
  const config = getMasterConfig(params.module)
  if (!config) return fail('Invalid master data module', 404)

  const { data, error } = await supabaseAdmin
    .from(config.table)
    .update({ is_active: false })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}
