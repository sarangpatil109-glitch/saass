# SAASS — Software As A Service System

**v1.0.0** — Production-ready SaaS administration platform built on **Next.js 16**, **Supabase**, and **Cashfree Payments**.

---

## Modules

| Module | Route | Description |
|---|---|---|
| Authentication | `/login` | Supabase Auth with RBAC (admin / vendor / sales_executive) |
| Dashboard | `/dashboard` | KPI overview — products, vendors, sales execs, customers |
| Products | `/dashboard/products` | CRUD, versions, pricing, demo config |
| Vendors | `/dashboard/vendors` | Vendor management with profile & team views |
| Sales Executives | `/dashboard/sales-executives` | SE management, profiles, commission dashboard |
| Lead CRM | `/dashboard/leads` | Kanban pipeline, conversion to customer |
| Tasks & Follow-ups | `/dashboard/tasks`, `/dashboard/followups` | Activity tracking |
| Commission Engine | `/dashboard/admin/commission` | Wallet, ledger, approval, payouts |
| Product Instance Generator | `/dashboard/admin/zips` | Branded ZIP package creation |
| License Management | `/dashboard/admin/licenses` | License keys, device fingerprinting, activation |
| Payments & Orders | `/dashboard/admin/payments`, `/dashboard/admin/orders` | Cashfree integration, invoices, refunds |
| Reports | `/dashboard/admin/reports` | Revenue, product, commission reports |
| Settings | `/dashboard/admin/settings` | Policies, admin profile, environment config |
| Activity Logs | `/dashboard/admin/logs` | Platform-wide activity audit |

---

## Architecture

- **Framework**: Next.js 16.x App Router (Server Components + Server Actions)
- **Database**: Supabase (PostgreSQL) with Row Level Security on every table
- **Authentication**: Supabase Auth
- **Payments**: Cashfree v3 API (sandbox + production)
- **License Tokens**: JWT offline tokens (jsonwebtoken)
- **ZIP Generation**: JSZip with config injection
- **Styling**: Vanilla CSS + utility classes (no Tailwind dependency)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/saass.git
cd saass

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Cashfree credentials

# 4. Apply database migrations
npx supabase db push

# 5. Start dev server
npm run dev
```

---

## Production Deployment (Vercel)

```bash
# Build locally first to verify
npm run build

# Deploy to Vercel
vercel --prod
```

Set all environment variables from `.env.example` in your Vercel project settings.

---

## Database Migrations

All migrations are in `supabase/migrations/`. Apply in order:

| File | Description |
|---|---|
| `20260704000001_initial_schema.sql` | Core tables: profiles, products, vendors, customers |
| `20260704000002_crm_schema.sql` | Leads, tasks, followups |
| `20260704000003_sales_schema.sql` | Sales executives |
| `20260704000004_commission_schema.sql` | Commission engine, wallet, ledger |
| `20260704000005_generator_schema.sql` | Product templates, instances, ZIP queue |
| `20260704000006_license_schema.sql` | Licenses, devices, activations, policies |
| `20260704000007_payment_schema.sql` | Orders, payments, invoices, webhooks |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/payments/webhook` | Cashfree webhook receiver (HMAC verified) |
| `POST` | `/api/license/activate` | Activate a license key on a device |
| `POST` | `/api/license/verify` | Verify an active license (online check) |

---

## Security

- All mutations are admin-only Server Actions
- Supabase RLS policies on every table
- Webhook signature verified with HMAC-SHA256
- JWT secrets never exposed to the client
- License keys signed offline with configurable grace period

---

## Release Notes — v1.0.0

- Initial production release
- All modules implemented and build-verified
- 0 TypeScript errors, 0 ESLint errors
- 41 routes compiled successfully

---

## License

Proprietary — SAASS Platform © 2026
