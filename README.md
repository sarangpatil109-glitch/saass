# SAASS (Software As A Service System)

A comprehensive, production-ready SaaS administration platform covering Vendor Management, Lead CRM, Commission Engines, Product/Version Control, Automated ZIP Generation, Licensing, and Cashfree Sandbox Payments.

## Architecture
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Role-based access: Admin, Vendor, Sales Executive)
- **Payment Gateway**: Cashfree (Sandbox)

## Modules
1. **Admin / Vendor / Sales Executive Management**: Tiered RBAC system.
2. **Lead CRM**: Pipeline management with automatic customer conversion on 'Won'.
3. **Commission Engine**: Real-time sales calculations via PostgreSQL triggers.
4. **Product Management**: Track categories, versions, dynamic pricing, and demo configurations.
5. **ZIP Generator**: Simulated automated software building and delivery tracking.
6. **License Management**: Hardware fingerprinting, public verification APIs, and manual override tracking.
7. **Payments**: Cashfree Webhook processing, auto-invoicing, and refund ledgering.

## Quick Start
1. Clone the repository.
2. Copy `.env.example` to `.env.local` and configure your keys.
3. Run `npm install`.
4. Push migrations to Supabase: `supabase db push`.
5. Start the development server: `npm run dev`.

## Production Build
To create a production build, run:
```bash
npm run build
```
Start the production server:
```bash
npm start
```
