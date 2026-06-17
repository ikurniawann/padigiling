import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/api-response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*, sales_channels(name), orders(*, sales_channels(name))')
    .eq('id', params.id)
    .single()

  if (error) return fail('Customer tidak ditemukan', 404)
  return ok(data)
}
