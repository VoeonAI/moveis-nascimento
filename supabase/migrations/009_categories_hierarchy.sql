-- Add hierarchy columns to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

-- Add unique constraint on slug
ALTER TABLE categories 
ADD CONSTRAINT categories_slug_key UNIQUE (slug);

-- Create index on parent_id for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Insert Root Categories
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Sala', 'sala', NULL, true, 1),
('Sala de Jantar', 'sala-de-jantar', NULL, true, 2),
('Quarto', 'quarto', NULL, true, 3),
('Quarto Infantil/Juvenil', 'quarto-infantil-juvenil', NULL, true, 4),
('Cozinha', 'cozinha', NULL, true, 5),
('Área de Serviço/Multiuso', 'area-de-servico-multiuso', NULL, true, 6),
('Escritório', 'escritorio', NULL, true, 7),
('Área Externa', 'area-externa', NULL, true, 8),
('Bikes', 'bikes', NULL, true, 9),
('Tapetes', 'tapetes', NULL, true, 10),
('Colchões', 'colchoes', NULL, true, 11)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Sala)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Sofás', 'sofas', (SELECT id FROM categories WHERE slug = 'sala'), true, 1),
('Poltronas', 'poltronas', (SELECT id FROM categories WHERE slug = 'sala'), true, 2),
('Mesas de Centro', 'mesas-de-centro', (SELECT id FROM categories WHERE slug = 'sala'), true, 3),
('Racks', 'racks', (SELECT id FROM categories WHERE slug = 'sala'), true, 4),
('Painéis', 'painels', (SELECT id FROM categories WHERE slug = 'sala'), true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Sala de Jantar)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Mesas', 'mesas-jantar', (SELECT id FROM categories WHERE slug = 'sala-de-jantar'), true, 1),
('Cadeiras', 'cadeiras-jantar', (SELECT id FROM categories WHERE slug = 'sala-de-jantar'), true, 2),
('Buffets', 'buffets', (SELECT id FROM categories WHERE slug = 'sala-de-jantar'), true, 3),
('Aparadores', 'aparadores', (SELECT id FROM categories WHERE slug = 'sala-de-jantar'), true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Quarto)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Camas', 'camas', (SELECT id FROM categories WHERE slug = 'quarto'), true, 1),
('Guarda-roupas', 'guarda-roupas', (SELECT id FROM categories WHERE slug = 'quarto'), true, 2),
('Cômodas', 'comodas-quarto', (SELECT id FROM categories WHERE slug = 'quarto'), true, 3),
('Criados-mudos', 'criados-mudos', (SELECT id FROM categories WHERE slug = 'quarto'), true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Quarto Infantil/Juvenil)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Camas', 'camas-infantil', (SELECT id FROM categories WHERE slug = 'quarto-infantil-juvenil'), true, 1),
('Bicamas', 'bicamas', (SELECT id FROM categories WHERE slug = 'quarto-infantil-juvenil'), true, 2),
('Cômodas', 'comodas-infantil', (SELECT id FROM categories WHERE slug = 'quarto-infantil-juvenil'), true, 3),
('Escrivaninhas', 'escrivaninhas-infantil', (SELECT id FROM categories WHERE slug = 'quarto-infantil-juvenil'), true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Cozinha)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Mesas', 'mesas-cozinha', (SELECT id FROM categories WHERE slug = 'cozinha'), true, 1),
('Cadeiras', 'cadeiras-cozinha', (SELECT id FROM categories WHERE slug = 'cozinha'), true, 2),
('Armários', 'armarios-cozinha', (SELECT id FROM categories WHERE slug = 'cozinha'), true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Área de Serviço/Multiuso)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Armários', 'armarios-servico', (SELECT id FROM categories WHERE slug = 'area-de-servico-multiuso'), true, 1),
('Lavanderias', 'lavanderias', (SELECT id FROM categories WHERE slug = 'area-de-servico-multiuso'), true, 2),
('Racks', 'racks-servico', (SELECT id FROM categories WHERE slug = 'area-de-servico-multiuso'), true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Escritório)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Mesas', 'mesas-escritorio', (SELECT id FROM categories WHERE slug = 'escritorio'), true, 1),
('Cadeiras', 'cadeiras-escritorio', (SELECT id FROM categories WHERE slug = 'escritorio'), true, 2),
('Estantes', 'estantes', (SELECT id FROM categories WHERE slug = 'escritorio'), true, 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories (Área Externa)
INSERT INTO categories (name, slug, parent_id, active, sort_order) VALUES
('Mesas', 'mesas-externa', (SELECT id FROM categories WHERE slug = 'area-externa'), true, 1),
('Cadeiras', 'cadeiras-externa', (SELECT id FROM categories WHERE slug = 'area-externa'), true, 2),
('Espregadeiras', 'espregadeiras', (SELECT id FROM categories WHERE slug = 'area-externa'), true, 3)
ON CONFLICT (slug) DO NOTHING;