import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

const VALID_STATUSES = ['pending', 'in_progress', 'done']

/**
 * Update production_status on a single order_item.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null)
  if (!body) return fail('Invalid JSON body')

  const productionStatus = body.production_status
  if (!productionStatus || !VALID_STATUSES.includes(productionStatus)) {
    return fail(`production_status must be one of: ${VALID_STATUSES.join(', ')}`, 400)
  }

  const { data, error } = await supabaseAdmin
    .from('order_items')
    .update({ production_status: productionStatus })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return fail(error.message, 500, error)
  return ok(data)
}
