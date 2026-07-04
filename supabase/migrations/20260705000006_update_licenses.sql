-- 20260705000006_update_licenses.sql

ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS product_version TEXT;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS renewal_date TIMESTAMPTZ;
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS last_verification TIMESTAMPTZ;
ALTER TABLE public.licenses RENAME COLUMN issued_by TO generated_by;

-- Update license_devices
ALTER TABLE public.license_devices ADD COLUMN IF NOT EXISTS machine_fingerprint TEXT;
ALTER TABLE public.license_devices ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.license_devices RENAME COLUMN os_info TO os_name;
ALTER TABLE public.license_devices RENAME COLUMN registered_date TO activated_at;

-- Allow license_devices machine_fingerprint to be populated from device_id if needed,
-- but the objective says device_id and machine_fingerprint both exist.
-- If device_id was used as fingerprint before, copy it.
UPDATE public.license_devices SET machine_fingerprint = device_id WHERE machine_fingerprint IS NULL;

-- Update license_activity_logs (remarks instead of details)
ALTER TABLE public.license_activity_logs RENAME COLUMN details TO remarks;

-- Update orders to have license_id relation if not already
-- (already handled in 20260705000005_orders_customers_schema.sql, but licenses didn't exist then. Wait, licenses existed since 20260704000006).

-- Vendors read-only policy for their customers' licenses
CREATE POLICY "Vendors can read licenses of their orders" ON public.licenses FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()))
);

-- Sales Execs read-only policy for their customers' licenses
CREATE POLICY "Sales execs can read licenses of their orders" ON public.licenses FOR SELECT TO authenticated USING (
    order_id IN (SELECT id FROM public.orders WHERE sales_executive_id IN (SELECT id FROM public.sales_executives WHERE user_id = auth.uid()))
);
