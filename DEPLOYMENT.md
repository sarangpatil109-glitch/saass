# Deployment Guide v1.0

This guide outlines the steps to deploy the SAASS platform to production using Vercel and Supabase.

## 1. Supabase (Database & Auth)
1. Create a new project on [Supabase](https://supabase.com).
2. Under **Authentication > Providers**, enable Email auth and configure your site URL.
3. Navigate to **Database > Migrations** and execute the 8 migration files in chronological order from `supabase/migrations/` to construct the schema, triggers, and functions.
4. Note your `Project URL`, `anon public key`, and `service_role key`.

## 2. Cashfree (Payments)
1. Create a Cashfree Sandbox account.
2. Note your App ID and Secret Key.
3. In the Cashfree dashboard, configure your webhook endpoint to point to: `https://your-domain.com/api/payment/webhook`.

## 3. Vercel (Frontend Hosting)
1. Import your GitHub repository into Vercel.
2. Configure the Build Command as `npm run build` and Output Directory as `.next`.
3. Add the following Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (Server-side only)
   - `CASHFREE_CLIENT_SECRET`: Your Cashfree Webhook Secret
   - `NEXT_PUBLIC_SITE_URL`: The production URL (e.g., https://saass.vercel.app)
4. Deploy.

## Security Considerations
- **Service Role Key**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is NEVER prefixed with `NEXT_PUBLIC_`. It is used exclusively in the secure server-side API routes for Licensing and Webhook verifications.
- **Webhook Verifications**: Ensure the `CASHFREE_CLIENT_SECRET` matches exactly to prevent cryptographic signature failures during payment callbacks.
