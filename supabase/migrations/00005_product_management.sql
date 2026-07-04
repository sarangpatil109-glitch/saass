-- 1. Product Categories Table
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.product_categories (name) VALUES 
('Gym'), ('Swimming'), ('Tuition'), ('Salon'), ('Clinic');

-- 2. Expand Products Table
-- Assuming `products` exists with id, name, description, price, status, created_at, updated_at
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS full_description TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.product_categories(id),
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'Hidden', -- Public, Hidden
ADD COLUMN IF NOT EXISTS demo_url TEXT,
ADD COLUMN IF NOT EXISTS demo_status TEXT NOT NULL DEFAULT 'Disabled', -- Enabled, Disabled
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS is_one_time_payment BOOLEAN NOT NULL DEFAULT true;

-- Update Status constraint (if any) or just rely on application logic for Draft, Published, Hidden, Archived, Disabled
-- For migration safety, we will just use TEXT for status.

-- Set Gym category for existing products
UPDATE public.products SET category_id = (SELECT id FROM public.product_categories WHERE name = 'Gym' LIMIT 1) WHERE category_id IS NULL;

-- 3. Product Versions Table
CREATE TABLE public.product_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    version_string TEXT NOT NULL,
    major INT NOT NULL DEFAULT 1,
    minor INT NOT NULL DEFAULT 0,
    patch INT NOT NULL DEFAULT 0,
    release_notes TEXT,
    is_current_stable BOOLEAN NOT NULL DEFAULT false,
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one stable version per product
CREATE UNIQUE INDEX idx_single_stable_version ON public.product_versions (product_id) WHERE is_current_stable = true;

-- Function to handle setting a version as stable (unsets others automatically)
CREATE OR REPLACE FUNCTION set_stable_product_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current_stable = true THEN
        UPDATE public.product_versions
        SET is_current_stable = false
        WHERE product_id = NEW.product_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_stable_version
BEFORE INSERT OR UPDATE OF is_current_stable ON public.product_versions
FOR EACH ROW
EXECUTE PROCEDURE set_stable_product_version();

-- Indexes for performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_product_versions_product ON public.product_versions(product_id);
