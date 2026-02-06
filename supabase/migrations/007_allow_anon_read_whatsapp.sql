-- Allow anonymous users to read store_whatsapp_e164 (read-only)
CREATE POLICY "app_settings_public_read_store_whatsapp" ON public.app_settings
  FOR SELECT TO anon
  USING (key = 'store_whatsapp_e164');