-- 1. Commission Settings Table (Single Row Configuration)
CREATE TABLE public.commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_exec_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    vendor_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the default single row
INSERT INTO public.commission_settings (sales_exec_percentage, vendor_percentage) VALUES (10.00, 10.00);

-- 2. Sales Table (Foundation to trigger commissions)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    price NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed', -- Completed, Refunded
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Commissions Table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT,
    product_price NUMERIC(12,2) NOT NULL,
    sales_exec_percentage NUMERIC(5,2) NOT NULL,
    vendor_percentage NUMERIC(5,2) NOT NULL,
    sales_exec_amount NUMERIC(12,2) NOT NULL,
    vendor_amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Approved, Paid, Cancelled, Reversed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sale_id) -- Prevent duplicate commissions for the same sale
);

-- 4. Automatic Commission Calculation Trigger
CREATE OR REPLACE FUNCTION calculate_and_insert_commission()
RETURNS TRIGGER AS $$
DECLARE
    settings RECORD;
    se_amount NUMERIC(12,2);
    v_amount NUMERIC(12,2);
BEGIN
    IF NEW.status = 'Completed' THEN
        -- Fetch current settings
        SELECT * INTO settings FROM public.commission_settings LIMIT 1;
        
        -- Formula implementation
        -- Sales Exec Commission = Price * (Sales Exec % / 100)
        se_amount := ROUND((NEW.price * (settings.sales_exec_percentage / 100.0)), 2);
        
        -- Vendor Commission = Sales Exec Commission * (Vendor % / 100)
        v_amount := ROUND((se_amount * (settings.vendor_percentage / 100.0)), 2);
        
        -- Insert Commission Record
        INSERT INTO public.commissions (
            sale_id,
            sales_executive_id,
            vendor_id,
            product_price,
            sales_exec_percentage,
            vendor_percentage,
            sales_exec_amount,
            vendor_amount
        ) VALUES (
            NEW.id,
            NEW.sales_executive_id,
            NEW.vendor_id,
            NEW.price,
            settings.sales_exec_percentage,
            settings.vendor_percentage,
            se_amount,
            v_amount
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_calculate_commission
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE PROCEDURE calculate_and_insert_commission();

-- Indexes
CREATE INDEX idx_commissions_se ON public.commissions(sales_executive_id);
CREATE INDEX idx_commissions_vendor ON public.commissions(vendor_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_sales_se ON public.sales(sales_executive_id);
CREATE INDEX idx_sales_vendor ON public.sales(vendor_id);
