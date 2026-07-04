-- 1. Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_version_id UUID REFERENCES public.product_versions(id) ON DELETE RESTRICT,
    business_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Success, Failed, Cancelled, Refunded
    cashfree_order_id TEXT UNIQUE,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payments Table (Webhook Logs)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoices Table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Paid',
    invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Refund History Table
CREATE TABLE public.refund_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Refunded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to Auto-generate Invoice on Order Success
CREATE OR REPLACE FUNCTION generate_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    new_invoice_number TEXT;
    calc_tax NUMERIC(10, 2);
    calc_total NUMERIC(10, 2);
BEGIN
    IF NEW.status = 'Success' AND OLD.status != 'Success' THEN
        -- Generate Invoice Number (e.g. INV-2026-XXXX)
        new_invoice_number := 'INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || substring(md5(random()::text) from 1 for 6);
        new_invoice_number := upper(new_invoice_number);

        -- Basic Tax Mock (18% GST for example)
        calc_tax := NEW.amount * 0.18;
        calc_total := NEW.amount + calc_tax;

        INSERT INTO public.invoices (
            invoice_number,
            order_id,
            customer_id,
            business_name,
            amount,
            tax,
            grand_total
        ) VALUES (
            new_invoice_number,
            NEW.id,
            NEW.customer_id,
            NEW.business_name,
            NEW.amount,
            calc_tax,
            calc_total
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE generate_invoice_on_payment();

-- Indexes
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_invoices_order ON public.invoices(order_id);
CREATE INDEX idx_refunds_order ON public.refund_history(order_id);
