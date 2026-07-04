-- Update Vendors Table to match PRD

ALTER TABLE vendors
RENAME COLUMN company_name TO business_name;

ALTER TABLE vendors
RENAME COLUMN company_logo TO logo_url;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_discount_type TEXT CHECK (coupon_discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS coupon_discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_max_uses INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_used_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS coupon_status TEXT CHECK (coupon_status IN ('Active', 'Expired', 'Disabled')) DEFAULT 'Active';

-- Create vendor_products junction table
CREATE TABLE IF NOT EXISTS vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, product_id)
);

ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin users on vendor_products" ON vendor_products FOR ALL TO authenticated USING (true);

-- Create storage bucket for vendor logos if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor_files', 'vendor_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Vendor Files" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Upload Access Vendor Files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Update Access Vendor Files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'vendor_files' );

CREATE POLICY "Admin Delete Access Vendor Files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'vendor_files' );
