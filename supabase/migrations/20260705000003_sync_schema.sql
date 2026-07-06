-- Migration: Complete Schema Sync
-- Date: 2026-07-05

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-assets', 'product-assets', true) ON CONFLICT (id) DO NOTHING;

-- RLS for buckets
-- Note: You might need to drop existing policies before creating them if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public view for payment-proofs" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public uploads to payment-proofs" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public view for product-assets" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public uploads to product-assets" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Allow public view for payment-proofs" ON storage.objects FOR SELECT USING ( bucket_id = 'payment-proofs' );
CREATE POLICY "Allow public uploads to payment-proofs" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'payment-proofs' );
CREATE POLICY "Allow public view for product-assets" ON storage.objects FOR SELECT USING ( bucket_id = 'product-assets' );
CREATE POLICY "Allow public uploads to product-assets" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'product-assets' );

-- 2. Modify Products Table
ALTER TABLE public.products
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS version,
DROP COLUMN IF EXISTS logo_url,
DROP COLUMN IF EXISTS zip_url,
DROP COLUMN IF EXISTS zip_template,
DROP COLUMN IF EXISTS monthly_price,
DROP COLUMN IF EXISTS yearly_price,
DROP COLUMN IF EXISTS slug,
DROP COLUMN IF EXISTS icon,
DROP COLUMN IF EXISTS image,
DROP COLUMN IF EXISTS thumbnail;

-- Add is_active if it was dropped accidentally
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Create Sales Requests Table
CREATE TABLE IF NOT EXISTS public.sales_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_price NUMERIC(15,2),
    payment_proof_url TEXT,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Modify Orders Table
-- Add missing columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sales_request_id UUID REFERENCES public.sales_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_price NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Drop old columns as explicitly requested
ALTER TABLE public.orders
DROP COLUMN IF EXISTS business_name,
DROP COLUMN IF EXISTS company_name,
DROP COLUMN IF EXISTS customer,
DROP COLUMN IF EXISTS vendor_name,
DROP COLUMN IF EXISTS lead_id,
DROP COLUMN IF EXISTS vendor_id,
DROP COLUMN IF EXISTS payment_id,
DROP COLUMN IF EXISTS invoice_id,
DROP COLUMN IF EXISTS license_id,
DROP COLUMN IF EXISTS zip_generation_id,
DROP COLUMN IF EXISTS amount,
DROP COLUMN IF EXISTS discount,
DROP COLUMN IF EXISTS tax,
DROP COLUMN IF EXISTS final_amount,
DROP COLUMN IF EXISTS payment_status,
DROP COLUMN IF EXISTS updated_at;
