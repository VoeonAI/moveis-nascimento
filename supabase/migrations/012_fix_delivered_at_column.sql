-- Ensure delivered_at column exists in orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;