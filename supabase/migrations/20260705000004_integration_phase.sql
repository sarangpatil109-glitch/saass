-- 1. Create Storage Bucket for QR Codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for qr-codes if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Give public access to qr-codes' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Give public access to qr-codes" ON storage.objects FOR SELECT USING (bucket_id = 'qr-codes');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload qr-codes' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload qr-codes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'qr-codes');
    END IF;
END $$;


-- 2. Add Profile Fields to Sales Executives
ALTER TABLE public.sales_executives
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- 3. Add Profile Fields to Vendors
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc TEXT,
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- 4. Create Order ID Sequence
CREATE SEQUENCE IF NOT EXISTS public.order_id_seq START 1;

-- 5. Atomic Approval RPC
CREATE OR REPLACE FUNCTION public.approve_sales_request(p_request_id UUID, p_admin_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_vendor_id UUID;
    v_product_name TEXT;
    v_order_id UUID;
    v_order_number TEXT;
    v_exec_comm NUMERIC(15,2);
    v_vendor_comm NUMERIC(15,2);
    v_price NUMERIC(15,2);
BEGIN
    -- Get request
    SELECT sr.*, p.name as prod_name 
    INTO v_request 
    FROM public.sales_requests sr
    LEFT JOIN public.products p ON p.id = sr.product_id
    WHERE sr.id = p_request_id FOR UPDATE;

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

    -- Generate Order Number (ORD-000001 format)
    v_order_number := 'ORD-' || to_char(nextval('public.order_id_seq'), 'FM000000');
    v_price := COALESCE(v_request.product_price, 0);

    -- Insert Order
    INSERT INTO public.orders (
        order_number, sales_request_id, sales_executive_id,
        customer_name, customer_phone, customer_email,
        product_id, product_name, product_price,
        payment_proof_url, status, approved_at, approved_by
    ) VALUES (
        v_order_number, v_request.id, v_request.sales_executive_id,
        v_request.customer_name, v_request.customer_phone, v_request.customer_email,
        v_request.product_id, v_request.prod_name, v_price,
        v_request.payment_proof_url, 'Approved', NOW(), p_admin_id
    ) RETURNING id INTO v_order_id;

    -- Update Request
    UPDATE public.sales_requests 
    SET status = 'Approved' 
    WHERE id = v_request.id;

    -- Calculate Commissions EXACTLY as required
    v_exec_comm := v_price * 0.10;
    v_vendor_comm := v_exec_comm * 0.10;

    -- Insert Commission Transaction
    INSERT INTO public.commissions (
        order_id, sales_exec_id, vendor_id,
        sales_exec_commission, vendor_commission,
        percentage, status, amount
    ) VALUES (
        v_order_id, v_request.sales_executive_id, v_vendor_id,
        v_exec_comm, v_vendor_comm,
        10, 'Pending', v_exec_comm + v_vendor_comm
    );

    -- Insert into customers table
    INSERT INTO public.customers (
        customer_name, phone, email,
        sales_executive_id, vendor_id, status
    ) VALUES (
        v_request.customer_name, v_request.customer_phone, v_request.customer_email,
        v_request.sales_executive_id, v_vendor_id, 'Active'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$;
