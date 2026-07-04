-- Commission Engine Schema

CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_exec_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  vendor_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Represents % of the Sales Exec's commission
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial settings row
INSERT INTO commission_settings (sales_exec_percent, vendor_percent) VALUES (10.00, 10.00);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_price NUMERIC(15, 2) NOT NULL,
  sales_exec_id UUID REFERENCES sales_executives(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  exec_commission_percent NUMERIC(5, 2) NOT NULL,
  exec_commission_amount NUMERIC(15, 2) NOT NULL,
  vendor_commission_percent NUMERIC(5, 2) NOT NULL,
  vendor_commission_amount NUMERIC(15, 2) NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Paid', 'Rejected', 'Cancelled', 'Reversed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('Sales Executive', 'Vendor')),
  entity_id UUID NOT NULL,
  available_balance NUMERIC(15, 2) DEFAULT 0,
  pending_balance NUMERIC(15, 2) DEFAULT 0,
  paid_balance NUMERIC(15, 2) DEFAULT 0,
  lifetime_earnings NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES commission_wallets(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  transaction_type TEXT CHECK (transaction_type IN ('Credit', 'Debit', 'Adjustment')),
  amount NUMERIC(15, 2) NOT NULL,
  reference TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Completed', 'Failed', 'Reversed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- NO updated_at FOR IMMUTABILITY
);

CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES commission_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  method TEXT CHECK (method IN ('Bank', 'UPI', 'Other')),
  reference TEXT,
  status TEXT CHECK (status IN ('Pending', 'Paid', 'Failed')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commission_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  commission_id UUID REFERENCES commissions(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access policy 
CREATE POLICY "Enable all access for admin users on commission_settings" ON commission_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commissions" ON commissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_wallets" ON commission_wallets FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_ledger" ON commission_ledger FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_payouts" ON commission_payouts FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on commission_activity_logs" ON commission_activity_logs FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commission_wallets_updated_at BEFORE UPDATE ON commission_wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_commission_payouts_updated_at BEFORE UPDATE ON commission_payouts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
