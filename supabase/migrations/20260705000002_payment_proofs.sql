-- Migration: Payment Proof Uploads & Remove Business Name from Sales Requests
-- Date: 2026-07-05

-- 1. Modify Orders Table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE public.orders
DROP COLUMN IF EXISTS business_name;

-- 2. Create Storage Bucket for Payment Proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
CREATE POLICY "Allow public uploads to payment-proofs" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'payment-proofs' );

CREATE POLICY "Allow public view for payment-proofs" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'payment-proofs' );

CREATE POLICY "Allow update for payment-proofs" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'payment-proofs' );
