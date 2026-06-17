-- ============================================================
-- RLS Policies — Padigiling CRM
-- Enable Row Level Security pada semua tabel aplikasi.
-- 
-- Prinsip:
-- - SELECT: semua authenticated user bisa baca
-- - INSERT/UPDATE/DELETE: hanya staff (owner/admin/sales)
-- - Invoice/Payment: juga finance
-- - Master data write: admin only
-- ============================================================

-- 1. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role::text = ANY(required_roles)
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.user_has_role(ARRAY['owner', 'admin', 'sales']); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$ SELECT public.user_has_role(ARRAY['owner', 'admin']); $$;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.greeting_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_order_parses ENABLE ROW LEVEL SECURITY;

-- Master tables
DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY[
  'master_order_types','master_order_statuses','master_payment_statuses',
  'master_payment_platforms','master_payment_methods','master_couriers',
  'master_delivery_statuses','master_product_categories','master_occasion_types',
  'master_greeting_card_options','master_lost_reasons'
] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
END LOOP; END $$;

-- 3. SELECT POLICIES — all authenticated users
CREATE POLICY "auth_select_users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_channels" ON public.sales_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_stages" ON public.pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_deliveries" ON public.deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_cards" ON public.greeting_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_activities" ON public.lead_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_wa" ON public.wa_order_parses FOR SELECT TO authenticated USING (true);

DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY[
  'master_order_types','master_order_statuses','master_payment_statuses',
  'master_payment_platforms','master_payment_methods','master_couriers',
  'master_delivery_statuses','master_product_categories','master_occasion_types',
  'master_greeting_card_options','master_lost_reasons'
] LOOP
  EXECUTE format('CREATE POLICY auth_select_%I ON public.%I FOR SELECT TO authenticated USING (true)', t, t);
END LOOP; END $$;

-- 4. INSERT POLICIES — staff only
CREATE POLICY "staff_insert_customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_deliveries" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_cards" ON public.greeting_cards FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_addresses" ON public.customer_addresses FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_wa" ON public.wa_order_parses FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY "staff_insert_activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (public.is_staff());

-- Invoices & payments: staff + finance
CREATE POLICY "staff_insert_invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.user_has_role(ARRAY['owner','admin','sales','finance']));
CREATE POLICY "staff_insert_payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.user_has_role(ARRAY['owner','admin','sales','finance']));

-- Sales channels & pipeline stages: admin only
CREATE POLICY "admin_insert_channels" ON public.sales_channels FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_insert_stages" ON public.pipeline_stages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_insert_products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Master tables: admin only
DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY[
  'master_order_types','master_order_statuses','master_payment_statuses',
  'master_payment_platforms','master_payment_methods','master_couriers',
  'master_delivery_statuses','master_product_categories','master_occasion_types',
  'master_greeting_card_options','master_lost_reasons'
] LOOP
  EXECUTE format('CREATE POLICY admin_insert_%I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', t, t);
END LOOP; END $$;

-- 5. UPDATE POLICIES — staff only
CREATE POLICY "staff_update_customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "staff_update_leads" ON public.leads FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "staff_update_orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "staff_update_deliveries" ON public.deliveries FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "staff_update_addresses" ON public.customer_addresses FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "staff_update_invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (public.user_has_role(ARRAY['owner','admin','sales','finance']))
  WITH CHECK (public.user_has_role(ARRAY['owner','admin','sales','finance']));

CREATE POLICY "staff_update_payments" ON public.payments FOR UPDATE TO authenticated
  USING (public.user_has_role(ARRAY['owner','admin','sales','finance']))
  WITH CHECK (public.user_has_role(ARRAY['owner','admin','sales','finance']));

CREATE POLICY "admin_update_channels" ON public.sales_channels FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_stages" ON public.pipeline_stages FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_products" ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DO $$ DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY[
  'master_order_types','master_order_statuses','master_payment_statuses',
  'master_payment_platforms','master_payment_methods','master_couriers',
  'master_delivery_statuses','master_product_categories','master_occasion_types',
  'master_greeting_card_options','master_lost_reasons'
] LOOP
  EXECUTE format('CREATE POLICY admin_update_%I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t, t);
END LOOP; END $$;

-- 6. DELETE POLICIES — staff only
CREATE POLICY "staff_delete_leads" ON public.leads FOR DELETE TO authenticated USING (public.is_staff());