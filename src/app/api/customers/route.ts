import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fail, ok } from '@/lib/api-response'

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*, sales_channels(name), orders(id, order_no, grand_total, created_at)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return fail('Gagal mengambil data customer', 500)
  return ok(data || [])
}
