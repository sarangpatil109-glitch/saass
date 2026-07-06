-- Migration: Sales Executive -> Admin Approval -> Commission Workflow
-- Date: 2026-07-05

-- 1. Orders Table Updates
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_price NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 2. Customers Table Updates
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE SET NULL;

-- 3. Commissions Table Updates
-- (Note: 'commissions' exists, but missing workflow columns)
ALTER TABLE public.commissions
ADD COLUMN IF NOT EXISTS sales_exec_commission NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS vendor_commission NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2);
