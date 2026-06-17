-- Seed: Pipeline Stages untuk Padigiling CRM
-- Jalankan di Supabase SQL Editor

INSERT INTO public.pipeline_stages (name, code, sort_order, is_final, is_won, is_lost) VALUES
  ('Baru',        'new',         1, false, false, false),
  ('Dihubungi',   'contacted',   2, false, false, false),
  ('Follow Up',   'follow_up',   3, false, false, false),
  ('Penawaran',   'quotation',   4, false, false, false),
  ('Negosiasi',   'negotiation', 5, false, false, false),
  ('Deal',        'won',         6, true,  true,  false),
  ('Batal',       'lost',        7, true,  false, true )
ON CONFLICT (code) DO NOTHING;

-- Seed: Sales Channels
INSERT INTO public.sales_channels (name, code) VALUES
  ('WhatsApp', 'wa'), ('Tokopedia', 'tokopedia'), ('Shopee', 'shopee'),
  ('Website', 'website'), ('Instagram', 'instagram'), ('Referral', 'referral'),
  ('Walk-in', 'walk_in'), ('Lainnya', 'other')
ON CONFLICT (code) DO NOTHING;

-- Seed: Order Statuses
INSERT INTO public.master_order_statuses (name, code, sort_order, is_active) VALUES
  ('Draft', 'draft', 1, true), ('Invoice Disiapkan', 'invoice_prepared', 2, true),
  ('Invoice Terkirim', 'invoice_sent', 3, true), ('Menunggu Pembayaran', 'waiting_payment', 4, true),
  ('Pembayaran Terverifikasi', 'payment_verified', 5, true), ('Diproses', 'processing', 6, true),
  ('Siap', 'ready', 7, true), ('Dalam Pengiriman', 'out_for_delivery', 8, true),
  ('Selesai', 'completed', 9, true), ('Dibatalkan', 'cancelled', 10, true)
ON CONFLICT (code) DO NOTHING;

-- Seed: Payment Platforms
INSERT INTO public.master_payment_platforms (name, code, sort_order, is_active) VALUES
  ('Paper.id', 'paper_id', 1, true), ('Transfer', 'transfer', 2, true),
  ('QRIS', 'qris', 3, true), ('Cash', 'cash', 4, true)
ON CONFLICT (code) DO NOTHING;

-- Seed: Couriers
INSERT INTO public.master_couriers (name, code, sort_order, is_active) VALUES
  ('Gojek', 'gojek', 1, true), ('Grab', 'grab', 2, true), ('JNE', 'jne', 3, true),
  ('J&T', 'jnt', 4, true), ('SiCepat', 'sicepat', 5, true), ('AnterAja', 'anteraja', 6, true),
  ('Pickup Sendiri', 'pickup', 7, true)
ON CONFLICT (code) DO NOTHING;

-- Seed: Order Types
INSERT INTO public.master_order_types (name, code, sort_order, is_active) VALUES
  ('Delivery', 'delivery', 1, true), ('Pickup', 'pickup', 2, true)
ON CONFLICT (code) DO NOTHING;
