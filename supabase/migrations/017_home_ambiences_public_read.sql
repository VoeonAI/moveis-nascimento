-- Habilitar leitura pública para ambientes da home
-- Isso permite que usuários anônimos vejam os ambientes na página inicial

-- Política para leitura pública de ambientes ativos
CREATE POLICY "home_ambiences_public_read_active" 
ON public.home_ambiences 
FOR SELECT 
USING (active = true);

-- Política para leitura pública de todos os ambientes (para admin)
CREATE POLICY "home_ambiences_public_read_all" 
ON public.home_ambiences 
FOR SELECT 
USING (true);