-- Create home_config table
CREATE TABLE IF NOT EXISTS public.home_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_highlight_word TEXT,
  ambiences JSONB DEFAULT '[]'::jsonb,
  promo_enabled BOOLEAN DEFAULT false,
  promo_image_url TEXT,
  promo_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.home_config ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "home_config_public_read" ON public.home_config
  FOR SELECT
  TO public
  USING (true);

-- Admin write access (using the existing is_master function)
CREATE POLICY "home_config_admin_write" ON public.home_config
  FOR ALL
  TO authenticated
  USING (is_master());

-- Insert default config
INSERT INTO public.home_config (hero_image_url, hero_title, hero_highlight_word, ambiences, promo_enabled)
VALUES (
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
  'Porque a sua casa',
  'merece o melhor',
  '[]'::jsonb,
  false
) ON CONFLICT DO NOTHING;