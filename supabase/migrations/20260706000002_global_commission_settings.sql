-- Migration: Global Commission Settings
-- Date: 2026-07-06

-- 1. Drop existing unused or incorrect commission_settings table
DROP TABLE IF EXISTS public.commission_settings CASCADE;

-- 2. Create the new global commission_settings table
CREATE TABLE public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_exec_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    vendor_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert default row
INSERT INTO public.commission_settings (sales_exec_percentage, vendor_percentage) 
VALUES (10.00, 1.00);

-- 4. Remove commission_type and commission_value from vendors
ALTER TABLE public.vendors
DROP COLUMN IF EXISTS commission_type,
DROP COLUMN IF EXISTS commission_value;

-- 5. Drop approve_sales_request as it's no longer used and uses outdated commission logic
DROP FUNCTION IF EXISTS public.approve_sales_request(UUID, UUID);
