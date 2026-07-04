-- Product Management Module Schema
-- Extends the existing Supabase setup

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default Categories Seed
INSERT INTO product_categories (name, slug) VALUES
  ('Gym', 'gym'),
  ('Swimming Pool', 'swimming-pool'),
  ('Tuition', 'tuition'),
  ('Salon', 'salon'),
  ('Clinic', 'clinic'),
  ('Restaurant', 'restaurant'),
  ('Retail', 'retail')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  full_description TEXT,
  category_id UUID REFERENCES product_categories(id),
  version TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_type TEXT CHECK (billing_type IN ('One-time', 'Monthly', 'Yearly')),
  status TEXT CHECK (status IN ('Draft', 'Published', 'Archived', 'Disabled')) DEFAULT 'Draft',
  demo_url TEXT,
  logo_url TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Support for soft deletes
);

CREATE TABLE IF NOT EXISTS product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  major INT NOT NULL DEFAULT 1,
  minor INT NOT NULL DEFAULT 0,
  patch INT NOT NULL DEFAULT 0,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  release_notes TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy (assume we check auth.uid() against profiles or similar, here is a generic true for authenticated to simplify if using server-side admin client)
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Enable all access for admin users" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable read access for categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Enable all access for admin users on categories" ON product_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on versions" ON product_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on logs" ON product_activity_logs FOR ALL TO authenticated USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE
ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
