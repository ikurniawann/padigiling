-- ============================================================
-- Production Board — Add production_status to order_items
-- ============================================================

-- 1. Add column
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS production_status text NOT NULL DEFAULT 'pending';

-- 2. Add RLS UPDATE policy for order_items (staff only)
-- Previously order_items only had SELECT + INSERT policies.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'order_items'
    AND policyname = 'staff_update_items'
  ) THEN
    CREATE POLICY "staff_update_items" ON public.order_items
    FOR UPDATE TO authenticated
    USING (public.is_staff())
    WITH CHECK (public.is_staff());
  END IF;
END $$;
