-- Add lead_id column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

-- Ensure operational fields exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS internal_code TEXT;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill lead_id for existing orders based on opportunity_id
UPDATE public.orders o
SET lead_id = opp.lead_id
FROM public.opportunities opp
WHERE o.opportunity_id = opp.id
  AND o.lead_id IS NULL;