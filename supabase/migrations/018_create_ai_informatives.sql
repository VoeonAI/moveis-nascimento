-- Create ai_informatives table
CREATE TABLE public.ai_informatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'notice',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_informatives ENABLE ROW LEVEL SECURITY;

-- Policies: only master and gestor can manage informatives
CREATE POLICY "informatives_read_master_gestor" ON public.ai_informatives
FOR SELECT TO authenticated
USING (current_role() IN ('master', 'gestor'));

CREATE POLICY "informatives_write_master_gestor" ON public.ai_informatives
FOR ALL TO authenticated
USING (current_role() IN ('master', 'gestor'))
WITH CHECK (current_role() IN ('master', 'gestor'));

-- Create trigger for updated_at
CREATE TRIGGER trg_ai_informatives_updated_at
BEFORE UPDATE ON public.ai_informatives
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create index for active informatives query
CREATE INDEX idx_ai_informatives_active_dates ON public.ai_informatives(active, starts_at, ends_at) WHERE active = true;