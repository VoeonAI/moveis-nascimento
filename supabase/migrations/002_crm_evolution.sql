-- 1. Alterar tabela leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS unread_interest_count INTEGER DEFAULT 0;

-- 2. Criar tabela lead_timeline
CREATE TABLE IF NOT EXISTS lead_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE lead_timeline ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para lead_timeline
-- Master e Gestor podem tudo
CREATE POLICY "lead_timeline_master_gestor_all"
ON lead_timeline
FOR ALL
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('master', 'gestor')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('master', 'gestor')
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_timeline_lead_id ON lead_timeline(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_unread_count ON leads(unread_interest_count DESC);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_needed DESC, follow_up_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at DESC);