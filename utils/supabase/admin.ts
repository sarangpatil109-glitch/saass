import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/** Ensure default admin user exists */
export async function ensureAdminUser() {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const adminEmail = 'sarangpatil109@gmail.com';
  const adminPassword = 'India@11';

  try {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    });
    if (createError) {
      // Supabase may return different messages/codes when the user already exists.
      // Treat "User already exists" or "email_exists" as a successful outcome.
      const isAlreadyExists =
        createError.message === 'User already exists' ||
        (createError as any).code === 'email_exists' ||
        (createError as any).message?.includes('email_exists');
      if (!isAlreadyExists) {
        console.error('Error creating admin user:', createError);
      }
    }
    // If no error or error indicates existing user, consider it successful.
  } catch (e) {
    console.error('Error creating admin user:', e);
  }
}
