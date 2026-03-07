-- Reload PostgREST schema cache
-- This ensures PostgREST recognizes the delivered_at column
SELECT pg_notify('pgrst', 'reload schema');