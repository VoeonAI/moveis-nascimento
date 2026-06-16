-- Consolidates the schema surface required by the IA/n8n integration.
-- This migration is intentionally idempotent and non-destructive.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Agent tokens
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.agent_tokens
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

UPDATE public.agent_tokens
SET name = COALESCE(name, 'Agent Token')
WHERE name IS NULL;

ALTER TABLE public.agent_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_tokens'
      AND policyname = 'agent_tokens_master_all'
  ) THEN
    CREATE POLICY "agent_tokens_master_all"
    ON public.agent_tokens
    FOR ALL
    TO authenticated
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master')
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'master');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_tokens_active ON public.agent_tokens(active);
CREATE INDEX IF NOT EXISTS idx_agent_tokens_last_used_at ON public.agent_tokens(last_used_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_tokens_token_hash_unique
ON public.agent_tokens(token_hash)
WHERE token_hash IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Orders contract used by pipeline and tracking agent endpoints
-- ---------------------------------------------------------------------------

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_stage TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS internal_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'stage'
  ) THEN
    UPDATE public.orders
    SET current_stage = COALESCE(current_stage, stage)
    WHERE current_stage IS NULL;
  END IF;
END $$;

UPDATE public.orders
SET current_stage = 'order_created'
WHERE current_stage IS NULL;

ALTER TABLE public.orders
ALTER COLUMN current_stage SET DEFAULT 'order_created';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'total_value'
  ) THEN
    ALTER TABLE public.orders
    ALTER COLUMN total_value DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_current_stage_known_values'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT orders_current_stage_known_values
    CHECK (
      current_stage IN (
        'order_created',
        'preparing_order',
        'assembly',
        'ready_to_ship',
        'delivery_route',
        'delivered',
        'canceled'
      )
    ) NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone_created_at
ON public.orders(customer_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_current_stage_created_at
ON public.orders(current_stage, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_lead_id
ON public.orders(lead_id);

CREATE INDEX IF NOT EXISTS idx_orders_opportunity_id
ON public.orders(opportunity_id);

-- Order events currently receive both triggered_by and created_by from services.

ALTER TABLE public.order_events
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Installers / assemblers used by public pages and agent_get_assemblers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.installers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.installers
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'installers'
      AND policyname = 'installers_public_active_read'
  ) THEN
    CREATE POLICY "installers_public_active_read"
    ON public.installers
    FOR SELECT
    TO anon, authenticated
    USING (active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'installers'
      AND policyname = 'installers_master_gestor_all'
  ) THEN
    CREATE POLICY "installers_master_gestor_all"
    ON public.installers
    FOR ALL
    TO authenticated
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master', 'gestor'))
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('master', 'gestor'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_installers_active_sort
ON public.installers(active, sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_installers_city
ON public.installers(city);

-- ---------------------------------------------------------------------------
-- Webhook endpoints/logs contract used by webhooks_dispatch and Settings
-- ---------------------------------------------------------------------------

ALTER TABLE public.webhook_endpoints
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS secret TEXT;

UPDATE public.webhook_endpoints
SET events = ARRAY[]::TEXT[]
WHERE events IS NULL;

UPDATE public.webhook_endpoints
SET active = true
WHERE active IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_endpoints'
      AND column_name = 'is_active'
  ) THEN
    UPDATE public.webhook_endpoints
    SET active = COALESCE(active, is_active);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_endpoints'
      AND column_name = 'event_type'
  ) THEN
    UPDATE public.webhook_endpoints
    SET events = CASE
      WHEN event_type IS NULL OR event_type = '' THEN events
      WHEN events IS NULL OR array_length(events, 1) IS NULL THEN ARRAY[event_type]
      WHEN event_type = ANY(events) THEN events
      ELSE array_append(events, event_type)
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_endpoints'
      AND column_name = 'event_type'
  ) THEN
    UPDATE public.webhook_endpoints
    SET name = COALESCE(name, event_type, 'Webhook')
    WHERE name IS NULL;
  ELSE
    UPDATE public.webhook_endpoints
    SET name = COALESCE(name, 'Webhook')
    WHERE name IS NULL;
  END IF;
END $$;

ALTER TABLE public.webhook_logs
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS error TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.webhook_logs
SET success = false
WHERE success IS NULL;

UPDATE public.webhook_logs
SET created_at = now()
WHERE created_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_logs'
      AND column_name = 'attempted_at'
  ) THEN
    UPDATE public.webhook_logs
    SET created_at = COALESCE(created_at, attempted_at)
    WHERE created_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active_events
ON public.webhook_endpoints USING GIN (events)
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at
ON public.webhook_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint_created_at
ON public.webhook_logs(endpoint_id, created_at DESC);
