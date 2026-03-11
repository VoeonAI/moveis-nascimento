-- Criar tabela home_ambiences
CREATE TABLE IF NOT EXISTS public.home_ambiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_home_ambiences_active ON public.home_ambiences(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_home_ambiences_sort ON public.home_ambiences(sort_order ASC);

-- Inserir dados exemplo para teste
INSERT INTO public.home_ambiences (title, category_slug, image_url, active, sort_order) VALUES
('Sala', 'sala', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', true, 1),
('Quarto', 'quarto', 'https://images.unsplash.com/photo-1616594039914-746bb0062b09?w=800&q=80', true, 2),
('Cozinha', 'cozinha', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80', true, 3),
('Escritório', 'escritorio', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80', true, 4),
('Infantil', 'infantil', 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80', true, 5);