export const MASTER_DATA_TABLES = {
  sales_channels: { table: 'sales_channels', hasSort: false, hasColor: false },
  pipeline_stages: { table: 'pipeline_stages', hasSort: true, hasColor: false, noActiveFilter: true },
  order_types: { table: 'master_order_types', hasSort: true, hasColor: false },
  order_statuses: { table: 'master_order_statuses', hasSort: true, hasColor: true },
  payment_statuses: { table: 'master_payment_statuses', hasSort: true, hasColor: true },
  payment_platforms: { table: 'master_payment_platforms', hasSort: true, hasColor: false },
  payment_methods: { table: 'master_payment_methods', hasSort: true, hasColor: false },
  couriers: { table: 'master_couriers', hasSort: true, hasColor: false },
  delivery_statuses: { table: 'master_delivery_statuses', hasSort: true, hasColor: true },
  product_categories: { table: 'master_product_categories', hasSort: true, hasColor: false },
  occasion_types: { table: 'master_occasion_types', hasSort: true, hasColor: false },
  greeting_card_options: { table: 'master_greeting_card_options', hasSort: true, hasColor: false },
  lost_reasons: { table: 'master_lost_reasons', hasSort: true, hasColor: false },
} as const

export type MasterDataModule = keyof typeof MASTER_DATA_TABLES

export function getMasterConfig(module: string) {
  return MASTER_DATA_TABLES[module as MasterDataModule]
}

export function cleanMasterPayload(input: Record<string, unknown>, config: { hasSort: boolean; hasColor: boolean }) {
  const payload: Record<string, unknown> = {
    name: String(input.name || '').trim(),
    code: String(input.code || '').trim(),
    is_active: input.is_active === undefined ? true : Boolean(input.is_active),
  }
  if (config.hasSort) payload.sort_order = Number(input.sort_order || 0)
  if (config.hasColor && input.color) payload.color = String(input.color)
  return payload
}
