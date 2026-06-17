-- Fix Padigiling CRM business number triggers
-- Run this in Supabase SQL Editor.
-- Reason: one generic trigger function referenced fields that do not exist on all tables.

create sequence if not exists public.order_no_seq start 1;
create sequence if not exists public.lead_no_seq start 1;
create sequence if not exists public.customer_no_seq start 1;

create or replace function public.set_order_no()
returns trigger language plpgsql as $$
begin
  if new.order_no is null then
    new.order_no := 'PG-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('public.order_no_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_lead_no()
returns trigger language plpgsql as $$
begin
  if new.lead_no is null then
    new.lead_no := 'LD-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('public.lead_no_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_customer_no()
returns trigger language plpgsql as $$
begin
  if new.customer_no is null then
    new.customer_no := 'CS-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('public.customer_no_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_order_no on public.orders;
drop trigger if exists set_lead_no on public.leads;
drop trigger if exists set_customer_no on public.customers;

create trigger set_order_no
before insert on public.orders
for each row execute function public.set_order_no();

create trigger set_lead_no
before insert on public.leads
for each row execute function public.set_lead_no();

create trigger set_customer_no
before insert on public.customers
for each row execute function public.set_customer_no();

-- Optional: remove old generic function if no longer used
-- drop function if exists public.set_business_numbers();
