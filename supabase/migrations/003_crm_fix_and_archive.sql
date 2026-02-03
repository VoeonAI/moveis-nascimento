-- 1. Fix last_activity_at for existing leads (populate with created_at)
UPDATE leads 
SET last_activity_at = created_at 
WHERE last_activity_at IS NULL;

-- 2. Add archived columns
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- 3. Update RLS policies to respect archived flag
-- For leads: non-master users can only see non-archived
DROP POLICY IF EXISTS "leads_read_write_master_gestor" ON leads;

CREATE POLICY "leads_read_write_master_gestor" ON leads
FOR ALL TO authenticated
USING (
  ("current_role"() = ANY (ARRAY['master'::text, 'gestor'::text])) AND
  (archived = false OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'master')
)
WITH CHECK (
  ("current_role"() = ANY (ARRAY['master'::text, 'gestor'::text]))
);

-- For opportunities: non-master users can only see non-archived
DROP POLICY IF EXISTS "opportunities_read_write_master_gestor" ON opportunities;

CREATE POLICY "opportunities_read_write_master_gestor" ON opportunities
FOR ALL TO authenticated
USING (
  ("current_role"() = ANY (ARRAY['master'::text, 'gestor'::text])) AND
  (archived = false OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'master')
)
WITH CHECK (
  ("current_role"() = ANY (ARRAY['master'::text, 'gestor'::text]))
);

-- 4. Create index for archived queries
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_archived ON opportunities(archived, created_at DESC);