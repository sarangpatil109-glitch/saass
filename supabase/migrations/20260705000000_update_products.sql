-- Add new columns to products table to match the updated PRD requirements

ALTER TABLE products
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS price_monthly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS zip_template TEXT;

-- Update the status check constraint to ensure it supports Draft, Published, Archived
-- (It already supports these in the previous migration, but just in case)
-- We will leave it as is if it's already defined, or we can drop and recreate the constraint if needed.
-- But standardizing it:
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('Draft', 'Published', 'Archived', 'Disabled'));

-- Create storage bucket for product files (logos, zip templates)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product_files', 'product_files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'product_files' );

CREATE POLICY "Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'product_files' );

CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'product_files' );

CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'product_files' );
