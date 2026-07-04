-- 20260705000005_orders_customers_schema.sql

-- 1. Update Customers Table
ALTER TABLE public.customers RENAME COLUMN name TO customer_name;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_code TEXT UNIQUE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Generate customer codes for existing records if null
UPDATE public.customers SET customer_code = 'CUST-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)) WHERE customer_code IS NULL;

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    payment_id TEXT,
    invoice_id TEXT, -- Connecting to invoice string/ID
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    zip_generation_id UUID REFERENCES public.generated_zips(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    order_status TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Awaiting Payment', 'Paid', 'Completed', 'Cancelled', 'Refunded', 'Expired', 'Renewed')),
    payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Success', 'Failed', 'Cancelled', 'Refunded')),
    payment_method TEXT,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    renewal_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for admin users on orders" ON public.orders FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Vendors see own orders" ON public.orders FOR SELECT TO authenticated USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
);

CREATE POLICY "Sales execs see own orders" ON public.orders FOR SELECT TO authenticated USING (
    sales_executive_id IN (SELECT id FROM public.sales_executives WHERE user_id = auth.uid())
);

-- Trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
