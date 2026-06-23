-- ============================================================
-- Product Management: categories, variants, custom price flag
-- ============================================================

-- 1. Product categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. Add missing columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku             text,
  ADD COLUMN IF NOT EXISTS base_price      numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_portion    int,
  ADD COLUMN IF NOT EXISTS category_id     uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_custom_price boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz DEFAULT now();

-- 3. Product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  sku        text,
  price      numeric(14,2) NOT NULL DEFAULT 0,
  portion    int,
  sort_order int         NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants    ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_categories' AND policyname='authenticated_read_categories') THEN
    CREATE POLICY "authenticated_read_categories" ON public.product_categories
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_categories' AND policyname='staff_write_categories') THEN
    CREATE POLICY "staff_write_categories" ON public.product_categories
      FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_variants' AND policyname='authenticated_read_variants') THEN
    CREATE POLICY "authenticated_read_variants" ON public.product_variants
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_variants' AND policyname='staff_write_variants') THEN
    CREATE POLICY "staff_write_variants" ON public.product_variants
      FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
  END IF;
END $$;
