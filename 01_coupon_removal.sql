-- Run this in the Supabase SQL Editor to apply the Vendor Assignment and Coupon Removal migration

-- 1. Sales Executives updates
ALTER TABLE public.sales_executives ALTER COLUMN vendor_id DROP NOT NULL;
ALTER TABLE public.sales_executives DROP COLUMN IF EXISTS vendor_coupon_code;

-- 2. Drop Coupon Codes table
DROP TABLE IF EXISTS public.vendor_coupon_codes CASCADE;

-- 3. Remove coupon columns from Vendors
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_code CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_discount_type CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_discount_value CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_max_uses CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_used_count CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_expiry_date CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_status CASCADE;

-- 4. In case the leads or commissions table had any dependencies (though checked earlier, none were found)
-- All done!
