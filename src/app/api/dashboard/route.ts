import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

/**
 * Dashboard aggregation endpoint.
 * Uses supabaseAdmin (service role) because cross-table aggregation
 * requires access beyond RLS. Protected by middleware auth guard.
 */
export async function GET() {
  const [ordersRes, customersRes, leadsRes, invoicesRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('id, order_no, status, grand_total, created_at, customers(name), sales_channels(name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('invoices').select('id, status, amount', { count: 'exact' }),
  ])

  if (ordersRes.error) return fail('Gagal mengambil data orders', 500)
  if (customersRes.error) return fail('Gagal mengambil data customers', 500)
  if (leadsRes.error) return fail('Gagal mengambil data leads', 500)
  if (invoicesRes.error) return fail('Gagal mengambil data invoices', 500)

  const orders = ordersRes.data || []
  const invoices = invoicesRes.data || []
  const revenue = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)
  const pendingInvoices = invoices.filter(
    (i) => ['draft', 'sent', 'waiting_payment'].includes(i.status)
  ).length

  const channelMap = new Map<string, { name: string; count: number; revenue: number }>()
  for (const o of orders) {
    const channel = (o.sales_channels as { name?: string } | null)?.name || 'Unknown'
    const current = channelMap.get(channel) || { name: channel, count: 0, revenue: 0 }
    current.count += 1
    current.revenue += Number(o.grand_total || 0)
    channelMap.set(channel, current)
  }

  return ok({
    stats: {
      revenue,
      total_orders: orders.length,
      total_customers: customersRes.count || 0,
      total_leads: leadsRes.count || 0,
      pending_invoices: pendingInvoices,
    },
    latest_orders: orders,
    channels: Array.from(channelMap.values()).sort((a, b) => b.revenue - a.revenue),
  })
}
