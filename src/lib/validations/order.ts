import { z } from 'zod'

export const createOrderSchema = z.object({
  // Customer
  customer_name: z.string().min(1, 'Nama customer wajib diisi').max(200),
  customer_phone: z.string().max(50).optional().default(''),

  // Recipient / Delivery
  recipient_name: z.string().max(200).optional().default(''),
  recipient_phone: z.string().max(50).optional().default(''),
  address: z.string().max(1000).optional().default(''),

  // Order
  order_text: z.string().max(2000).optional().default(''),
  order_type: z.enum(['delivery', 'pickup']).default('delivery'),
  channel_code: z.string().max(50).default('wa'),
  status: z.string().max(50).default('draft'),

  // Pricing
  subtotal: z.coerce.number().min(0).default(0),
  shipping_fee_customer: z.coerce.number().min(0).default(0),
  shipping_fee_real: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().min(1).default(1),

  // Delivery details
  courier: z.string().max(100).optional().default(''),
  delivery_date_text: z.string().max(100).optional().default(''),
  delivery_time_text: z.string().max(50).optional().default(''),

  // Greeting card
  greeting_card_message: z.string().max(2000).optional().default(''),

  // Invoice / Payment
  payment_platform: z.string().max(50).optional().default('paper_id'),

  // WA parsing metadata
  raw_wa_text: z.string().max(5000).optional().default(''),
  parsed_json: z.record(z.string(), z.unknown()).optional(),
  parser_type: z.string().max(50).optional().default('rule_based'),

  // Internal notes
  notes_internal: z.string().max(2000).optional().default(''),
  item_notes: z.string().max(1000).optional().default(''),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const updateOrderSchema = z.object({
  status: z.string().max(50).optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  order_type: z.enum(['delivery', 'pickup']).optional(),
  subtotal: z.number().min(0).optional(),
  shipping_fee_customer: z.number().min(0).optional(),
  shipping_fee_real: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  grand_total: z.number().min(0).optional(),
  payment_status: z.string().max(50).optional(),
  production_status: z.string().max(50).optional(),
  delivery_status: z.string().max(50).optional(),
  notes_customer: z.string().max(2000).optional(),
  notes_internal: z.string().max(2000).optional(),
})

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
