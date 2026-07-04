-- Add order_id to product_instances
ALTER TABLE public.product_instances ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- Also add license_id if it's generated later? Or we can query the license via order_id.
-- Let's add license_id to zip_generations? Or just rely on order_id.
ALTER TABLE public.zip_generations ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
