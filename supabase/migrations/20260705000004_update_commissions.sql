-- 20260705000004_update_commissions.sql

ALTER TABLE commission_settings RENAME COLUMN sales_exec_percent TO sales_commission_percentage;
ALTER TABLE commission_settings RENAME COLUMN vendor_percent TO vendor_commission_percentage;

ALTER TABLE commissions RENAME COLUMN sales_exec_id TO sales_executive_id;
ALTER TABLE commissions RENAME COLUMN exec_commission_percent TO sales_percentage;
ALTER TABLE commissions RENAME COLUMN exec_commission_amount TO sales_commission;
ALTER TABLE commissions RENAME COLUMN vendor_commission_percent TO vendor_percentage;
ALTER TABLE commissions RENAME COLUMN vendor_commission_amount TO vendor_commission;

ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

ALTER TABLE commission_wallets RENAME COLUMN entity_type TO user_type;
ALTER TABLE commission_wallets RENAME COLUMN entity_id TO user_id;
ALTER TABLE commission_wallets ADD COLUMN IF NOT EXISTS monthly_earnings NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE commission_ledger RENAME COLUMN reference TO remarks;
ALTER TABLE commission_ledger ADD COLUMN IF NOT EXISTS balance_after NUMERIC(15, 2) DEFAULT 0;

ALTER TABLE commission_payouts RENAME COLUMN reference TO reference_number;
ALTER TABLE commission_payouts RENAME COLUMN paid_date TO paid_at;
ALTER TABLE commission_payouts RENAME COLUMN created_at TO requested_at;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS upi TEXT;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE commission_payouts ADD COLUMN IF NOT EXISTS account_number TEXT;
