-- Add missing featured and on_promotion columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS on_promotion BOOLEAN NOT NULL DEFAULT FALSE;

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');