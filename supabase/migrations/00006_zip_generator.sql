-- 1. Generated ZIPs Table
CREATE TABLE public.generated_zips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_version_id UUID REFERENCES public.product_versions(id) ON DELETE RESTRICT,
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Generating', -- Generating, Completed, Downloaded, Delivered, Failed, Archived
    generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    download_count INT NOT NULL DEFAULT 0,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Delivery History Table
CREATE TABLE public.delivery_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_id UUID REFERENCES public.generated_zips(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    delivery_method TEXT,
    delivered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Delivered, Failed
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_generated_zips_customer ON public.generated_zips(customer_id);
CREATE INDEX idx_generated_zips_product ON public.generated_zips(product_id);
CREATE INDEX idx_generated_zips_status ON public.generated_zips(status);
CREATE INDEX idx_delivery_history_zip ON public.delivery_history(zip_id);
CREATE INDEX idx_delivery_history_status ON public.delivery_history(status);
