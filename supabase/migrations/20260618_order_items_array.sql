-- ============================================================
-- Update RPC: create_order_with_details
-- Tambah support p_items JSONB untuk multiple order items
-- Backward-compatible: jika p_items null, pakai cara lama
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_with_details(
  p_customer_name         TEXT,
  p_customer_phone        TEXT    DEFAULT NULL,
  p_channel_code          TEXT    DEFAULT 'wa',
  p_order_type            TEXT    DEFAULT 'delivery',
  p_status                TEXT    DEFAULT 'draft',
  p_subtotal              NUMERIC DEFAULT 0,
  p_shipping_fee_customer NUMERIC DEFAULT 0,
  p_shipping_fee_real     NUMERIC DEFAULT 0,
  p_discount              NUMERIC DEFAULT 0,
  p_order_text            TEXT    DEFAULT NULL,
  p_quantity              INTEGER DEFAULT 1,
  p_item_notes            TEXT    DEFAULT NULL,
  p_recipient_name        TEXT    DEFAULT NULL,
  p_recipient_phone       TEXT    DEFAULT NULL,
  p_address               TEXT    DEFAULT NULL,
  p_courier               TEXT    DEFAULT NULL,
  p_greeting_card_message TEXT    DEFAULT NULL,
  p_raw_wa_text           TEXT    DEFAULT NULL,
  p_parsed_json           JSONB   DEFAULT NULL,
  p_parser_type           TEXT    DEFAULT 'rule_based',
  p_notes_internal        TEXT    DEFAULT NULL,
  p_lead_id               UUID    DEFAULT NULL,
  p_items                 JSONB   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_channel_id   UUID;
  v_customer     RECORD;
  v_order        RECORD;
  v_subtotal     NUMERIC;
  v_grand_total  NUMERIC;
  v_won_stage_id UUID;
BEGIN
  -- Resolve channel
  SELECT id INTO v_channel_id
  FROM public.sales_channels
  WHERE code = p_channel_code
  LIMIT 1;

  -- Calculate subtotal: from items array if provided, else from p_subtotal
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    SELECT COALESCE(SUM((item->>'unit_price')::NUMERIC * (item->>'quantity')::INTEGER), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_items) AS item;
  ELSE
    v_subtotal := p_subtotal;
  END IF;

  v_grand_total := v_subtotal + p_shipping_fee_customer - p_discount;

  -- 1. Insert customer
  INSERT INTO public.customers (name, phone, first_channel_id)
  VALUES (p_customer_name, p_customer_phone, v_channel_id)
  RETURNING * INTO v_customer;

  -- 2. Insert order
  INSERT INTO public.orders (
    customer_id, channel_id, lead_id,
    order_type, status,
    subtotal, shipping_fee_customer, shipping_fee_real,
    discount, grand_total,
    notes_customer, notes_internal
  )
  VALUES (
    v_customer.id, v_channel_id, p_lead_id,
    p_order_type, p_status,
    v_subtotal, p_shipping_fee_customer, p_shipping_fee_real,
    p_discount, v_grand_total,
    p_order_text, p_notes_internal
  )
  RETURNING * INTO v_order;

  -- 3. Insert order items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, portion, notes)
    SELECT
      v_order.id,
      NULLIF(item->>'product_id', '')::UUID,
      item->>'product_name',
      (item->>'quantity')::INTEGER,
      (item->>'unit_price')::NUMERIC,
      CASE WHEN item->>'portion' IS NOT NULL AND item->>'portion' != ''
           THEN (item->>'portion')::INTEGER ELSE NULL END,
      NULLIF(item->>'notes', '')
    FROM jsonb_array_elements(p_items) AS item;
  ELSIF p_order_text IS NOT NULL OR v_subtotal > 0 THEN
    INSERT INTO public.order_items (order_id, product_name, quantity, unit_price, notes)
    VALUES (v_order.id, COALESCE(p_order_text, 'Order WhatsApp'), p_quantity, v_subtotal, p_item_notes);
  END IF;

  -- 4. Insert delivery
  INSERT INTO public.deliveries (
    order_id, delivery_type,
    recipient_name, recipient_phone,
    address, courier,
    shipping_fee_customer, shipping_fee_real
  )
  VALUES (
    v_order.id, p_order_type,
    COALESCE(p_recipient_name, p_customer_name),
    COALESCE(p_recipient_phone, p_customer_phone),
    p_address, p_courier,
    p_shipping_fee_customer, p_shipping_fee_real
  );

  -- 5. Greeting card
  IF p_greeting_card_message IS NOT NULL AND p_greeting_card_message != '' THEN
    INSERT INTO public.greeting_cards (order_id, is_required, message)
    VALUES (v_order.id, TRUE, p_greeting_card_message);
  END IF;

  -- 6. WA parse record
  IF p_raw_wa_text IS NOT NULL AND p_raw_wa_text != '' THEN
    INSERT INTO public.wa_order_parses (order_id, raw_text, parsed_json, parser_type)
    VALUES (v_order.id, p_raw_wa_text, COALESCE(p_parsed_json, '{}'::jsonb), p_parser_type);
  END IF;

  -- 7. Update lead if linked
  IF p_lead_id IS NOT NULL THEN
    SELECT id INTO v_won_stage_id
    FROM public.pipeline_stages
    WHERE is_won = true
    LIMIT 1;

    UPDATE public.leads
    SET converted_customer_id = v_customer.id,
        converted_order_id    = v_order.id,
        pipeline_stage_id     = COALESCE(v_won_stage_id, pipeline_stage_id)
    WHERE id = p_lead_id;
  END IF;

  RETURN json_build_object(
    'order',    row_to_json(v_order),
    'customer', row_to_json(v_customer)
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
