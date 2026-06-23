import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

type Period = '7d' | '30d' | '3m' | '12m'

function startDateFor(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '7d':  return new Date(now.getTime() - 7 * 86400_000)
    case '3m':  return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:    return new Date(now.getTime() - 30 * 86400_000)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period = (searchParams.get('period') || '30d') as Period
  const startDate = startDateFor(period)
  const startIso = startDate.toISOString()

  const EXCLUDED = '(draft,cancelled)'

  // --- 1. Orders for period ---
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, order_date, grand_total, customer_id')
    .not('status', 'in', EXCLUDED)
    .gte('order_date', startIso)

  if (ordersError) return fail(ordersError.message, 500, ordersError)
  const safeOrders = orders ?? []

  // --- 2. Summary ---
  const revenue = safeOrders.reduce((s, o) => s + (o.grand_total || 0), 0)
  const order_count = safeOrders.length
  const avg_order_value = order_count > 0 ? Math.round(revenue / order_count) : 0
  const unique_customers = new Set(safeOrders.map(o => o.customer_id).filter(Boolean)).size

  // --- 3. Revenue trend ---
  const trendMap = new Map<string, { label: string; revenue: number; order_count: number }>()
  const groupByMonth = period === '12m'

  for (const order of safeOrders) {
    const d = new Date(order.order_date)
    let key: string
    let label: string
    if (groupByMonth) {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    } else {
      key = order.order_date.split('T')[0]
      label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }
    const prev = trendMap.get(key) ?? { label, revenue: 0, order_count: 0 }
    trendMap.set(key, { label, revenue: prev.revenue + (order.grand_total || 0), order_count: prev.order_count + 1 })
  }
  const revenue_trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  // --- 4. Best products ---
  let best_products: Array<{ product_name: string; quantity: number; revenue: number }> = []
  const orderIds = safeOrders.map(o => o.id)

  if (orderIds.length > 0) {
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_name, quantity, total_price')
      .in('order_id', orderIds)

    const productMap = new Map<string, { product_name: string; quantity: number; revenue: number }>()
    for (const item of items ?? []) {
      const prev = productMap.get(item.product_name) ?? { product_name: item.product_name, quantity: 0, revenue: 0 }
      productMap.set(item.product_name, {
        product_name: item.product_name,
        quantity: prev.quantity + (item.quantity || 0),
        revenue: prev.revenue + (item.total_price || 0),
      })
    }
    best_products = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  // --- 5. Best customers ---
  let best_customers: Array<{ id: string; name: string; phone: string | null; order_count: number; total_spent: number }> = []
  const customerOrderMap = new Map<string, { order_count: number; total_spent: number }>()
  for (const order of safeOrders) {
    if (!order.customer_id) continue
    const prev = customerOrderMap.get(order.customer_id) ?? { order_count: 0, total_spent: 0 }
    customerOrderMap.set(order.customer_id, {
      order_count: prev.order_count + 1,
      total_spent: prev.total_spent + (order.grand_total || 0),
    })
  }

  const customerIds = Array.from(customerOrderMap.keys())
  if (customerIds.length > 0) {
    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone')
      .in('id', customerIds)

    best_customers = (customers ?? [])
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        order_count: customerOrderMap.get(c.id)?.order_count ?? 0,
        total_spent: customerOrderMap.get(c.id)?.total_spent ?? 0,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
  }

  return ok({ period, summary: { revenue, order_count, avg_order_value, unique_customers }, revenue_trend, best_products, best_customers })
}
