import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fail, ok } from '@/lib/api-response'

/**
 * Production Board — GET all order items that need production.
 * Groups by event_date → product_name.
 * Filters orders with status: payment_verified, processing, ready.
 */
export async function GET(_req: NextRequest) {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_no, event_date, event_time, status, notes_internal,
      customers(name, phone),
      deliveries(address, recipient_name),
      order_items(id, product_name, portion, quantity, unit_price, notes, production_status)
    `)
    .in('status', ['payment_verified', 'processing', 'ready'])
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })

  if (error) return fail('Gagal mengambil data produksi', 500, error)
  if (!orders?.length) return ok([])

  type CustomerRow = { name?: string; phone?: string }
  type DeliveryRow = { address?: string | null; recipient_name?: string | null }

  // Group by event_date → product_name
  const groups: Record<string, Record<string, {
    product_name: string
    total_quantity: number
    items: Array<{
      id: string
      order_id: string
      order_no: string
      customer_name: string
      customer_address: string | null
      portion: number | null
      quantity: number
      notes: string | null
      production_status: string
    }>
  }>> = {}

  for (const order of orders) {
    const dateKey = order.event_date || 'no-date'
    if (!groups[dateKey]) groups[dateKey] = {}

    const customer = order.customers as CustomerRow | null
    const deliveries = order.deliveries as DeliveryRow[] | null
    const delivery = deliveries?.[0] ?? null

    const items = order.order_items || []
    for (const item of items) {
      const name = item.product_name || 'Unknown'
      if (!groups[dateKey][name]) {
        groups[dateKey][name] = {
          product_name: name,
          total_quantity: 0,
          items: [],
        }
      }
      groups[dateKey][name].total_quantity += item.quantity || 0
      groups[dateKey][name].items.push({
        id: item.id,
        order_id: order.id,
        order_no: order.order_no,
        customer_name: customer?.name || '-',
        customer_address: delivery?.address || null,
        portion: item.portion,
        quantity: item.quantity || 0,
        notes: item.notes,
        production_status: item.production_status || 'pending',
      })
    }
  }

  // Convert to sorted array
  const result = Object.entries(groups).map(([date, products]) => ({
    event_date: date,
    products: Object.entries(products)
      .map(([name, p]) => p)
      .sort((a, b) => b.total_quantity - a.total_quantity),
  }))

  return ok(result)
}
