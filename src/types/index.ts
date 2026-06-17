// ============================================================
// Padigiling CRM — TypeScript Type Definitions
// ============================================================

// --- Enums / Union Types ---

export type UserRole = 'owner' | 'admin' | 'sales' | 'kitchen' | 'finance'

export type OrderType = 'delivery' | 'pickup'

export type OrderStatus =
  | 'draft'
  | 'preview'
  | 'invoice_prepared'
  | 'invoice_sent'
  | 'waiting_payment'
  | 'payment_verified'
  | 'processing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'unpaid' | 'waiting_payment' | 'waiting_verification' | 'paid' | 'refunded' | 'cancelled'

export type InvoiceStatus = 'draft' | 'sent' | 'waiting_payment' | 'paid' | 'cancelled' | 'expired'

export type DeliveryStatus = 'pending' | 'scheduled' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled'

export type PaymentVerifyStatus = 'pending' | 'waiting_verification' | 'verified' | 'rejected' | 'refunded'

// --- Master Data Tables ---

export interface SalesChannel {
  id: string
  name: string
  code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  name: string
  code: string
  sort_order: number
  is_final: boolean
  is_won: boolean
  is_lost: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string | null
  name: string
  category: string | null
  base_price: number
  base_portion: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// --- CRM Tables ---

export interface User {
  id: string
  auth_user_id: string | null
  name: string
  email: string | null
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  customer_no: string
  name: string
  phone: string | null
  email: string | null
  first_channel_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  sales_channels?: SalesChannel
  orders?: Order[]
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string | null
  recipient_name: string | null
  recipient_phone: string | null
  address: string
  city: string | null
  district: string | null
  province: string | null
  postal_code: string | null
  notes: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  lead_no: string
  name: string | null
  phone: string | null
  channel_id: string | null
  pipeline_stage_id: string | null
  assigned_user_id: string | null
  inquiry_text: string | null
  need_date: string | null
  follow_up_at: string | null
  lost_reason: string | null
  converted_customer_id: string | null
  converted_order_id: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_no: string
  lead_id: string | null
  customer_id: string | null
  channel_id: string | null
  assigned_user_id: string | null
  order_date: string
  event_date: string | null
  event_time: string | null
  order_type: OrderType
  status: OrderStatus
  subtotal: number
  shipping_fee_customer: number
  shipping_fee_real: number
  shipping_margin?: number // generated column
  discount: number
  grand_total: number
  payment_status: PaymentStatus
  production_status: string | null
  delivery_status: DeliveryStatus
  notes_customer: string | null
  notes_internal: string | null
  created_at: string
  updated_at: string
  // Relations
  customers?: Customer
  sales_channels?: SalesChannel
  order_items?: OrderItem[]
  deliveries?: Delivery[]
  greeting_cards?: GreetingCard[]
  invoices?: Invoice[]
  payments?: Payment[]
  wa_order_parses?: WaOrderParse[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  portion: number | null
  quantity: number
  unit_price: number
  total_price?: number // generated column
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Delivery {
  id: string
  order_id: string
  delivery_type: OrderType
  recipient_name: string | null
  recipient_phone: string | null
  address: string | null
  courier: string | null
  delivery_date: string | null
  delivery_time: string | null
  shipping_fee_customer: number
  shipping_fee_real: number
  tracking_no: string | null
  status: DeliveryStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GreetingCard {
  id: string
  order_id: string
  is_required: boolean
  message: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  order_id: string
  invoice_no: string | null
  platform: string
  external_invoice_id: string | null
  invoice_url: string | null
  invoice_date: string | null
  due_date: string | null
  status: InvoiceStatus
  amount: number
  sent_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  order_id: string
  invoice_id: string | null
  payment_method: string | null
  amount: number
  paid_at: string | null
  verified_at: string | null
  verified_by: string | null
  status: PaymentVerifyStatus
  proof_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WaOrderParse {
  id: string
  lead_id: string | null
  order_id: string | null
  raw_text: string
  parsed_json: Record<string, unknown>
  confidence_score: number | null
  parser_type: string
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string | null
  order_id: string | null
  user_id: string | null
  activity_type: string
  title: string
  description: string | null
  activity_at: string
  created_at: string
}

// --- API Response ---

export interface ApiResponse<T> {
  data: T | null
  error: { message: string; detail?: unknown } | null
}

// --- Dashboard Aggregations ---

export interface DashboardData {
  stats: {
    revenue: number
    total_orders: number
    total_customers: number
    total_leads: number
    pending_invoices: number
  }
  latest_orders: Order[]
  channels: ChannelSummary[]
}

export interface ChannelSummary {
  name: string
  count: number
  revenue: number
}
