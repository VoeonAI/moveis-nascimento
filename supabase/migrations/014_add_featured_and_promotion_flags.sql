-- Add featured and on_promotion flags to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS on_promotion BOOLEAN NOT NULL DEFAULT FALSE;