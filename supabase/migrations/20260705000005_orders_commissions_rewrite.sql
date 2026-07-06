-- Migration: Final Rewrite of Orders and Commissions
-- Date: 2026-07-05

-- 1. Add exec_commission_percent to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS exec_commission_percent NUMERIC(5,2) DEFAULT 10.00;

-- 2. Drop existing Orders and Commissions since we are restructuring heavily
-- First, drop the commissions and commission_transactions tables if they exist
DROP TABLE IF EXISTS public.commissions CASCADE;
DROP TABLE IF EXISTS public.commission_transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 3. Recreate Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    price NUMERIC(15,2) NOT NULL,
    payment_status TEXT DEFAULT 'Paid',
    status TEXT DEFAULT 'Approved',
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Create Order ID Sequence
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq START 1;

-- 4. Recreate Commissions Table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.orders(order_id) ON DELETE CASCADE,
    sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    vendor_amount NUMERIC(15,2) NOT NULL,
    platform_amount NUMERIC(15,2) NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Rewrite Atomic Approval RPC
CREATE OR REPLACE FUNCTION public.approve_sales_request(p_request_id UUID, p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_vendor_id UUID;
    v_order_id TEXT;
    v_exec_comm NUMERIC(15,2);
    v_vendor_comm NUMERIC(15,2);
    v_platform_rev NUMERIC(15,2);
    v_price NUMERIC(15,2);
    v_customer_id UUID;
BEGIN
    -- Get request and product details
    SELECT sr.*, p.name as prod_name, p.exec_commission_percent 
    INTO v_request 
    FROM public.sales_requests sr
    LEFT JOIN public.products p ON p.id = sr.product_id
    WHERE sr.id = p_request_id FOR UPDATE OF sr;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sales Request not found';
    END IF;

    IF v_request.status = 'Approved' THEN
        RAISE EXCEPTION 'Sales Request is already approved';
    END IF;

    -- Get vendor ID from Sales Executive
    SELECT vendor_id INTO v_vendor_id 
    FROM public.sales_executives 
    WHERE id = v_request.sales_executive_id;

    -- Check if Customer exists, otherwise create
    SELECT id INTO v_customer_id FROM public.customers 
    WHERE phone = v_request.customer_phone OR email = v_request.customer_email 
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (
            customer_name, phone, email,
            sales_executive_id, vendor_id, status
        ) VALUES (
            v_request.customer_name, v_request.customer_phone, v_request.customer_email,
            v_request.sales_executive_id, v_vendor_id, 'Active'
        ) RETURNING id INTO v_customer_id;
    END IF;

    -- Generate Order ID (ORD-YYYYMMDD-XXXXXX format)
    v_order_id := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || to_char(nextval('public.order_id_seq'), 'FM000000');
    v_price := COALESCE(v_request.product_price, 0);

    -- Insert Order
    INSERT INTO public.orders (
        order_id, customer_id, customer_name,
        product_id, product_name, vendor_id, sales_exec_id,
        price, payment_status, status, approved_at, created_at
    ) VALUES (
        v_order_id, v_customer_id, v_request.customer_name,
        v_request.product_id, v_request.prod_name, v_vendor_id, v_request.sales_executive_id,
        v_price, 'Paid', 'Approved', NOW(), NOW()
    );

    -- Update Request
    UPDATE public.sales_requests 
    SET status = 'Approved' 
    WHERE id = v_request.id;

    -- Calculate Commissions
    v_exec_comm := v_price * (COALESCE(v_request.exec_commission_percent, 10.00) / 100);
    v_vendor_comm := v_exec_comm * 0.10;
    v_platform_rev := v_price - v_exec_comm - v_vendor_comm;

    -- Insert Commission Transaction
    INSERT INTO public.commissions (
        order_id, sales_exec_id, vendor_id, customer_id,
        amount, vendor_amount, platform_amount,
        status, created_at
    ) VALUES (
        v_order_id, v_request.sales_executive_id, v_vendor_id, v_customer_id,
        v_exec_comm, v_vendor_comm, v_platform_rev,
        'Pending', NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id
    );
END;
$$;
