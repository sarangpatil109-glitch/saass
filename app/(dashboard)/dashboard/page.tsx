import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardController() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (!profile) {
    redirect('/login');
  }

  // Route the user to their appropriate dashboard based on role
  if (profile.role === 'admin') {
    redirect('/admin');
  } else if (profile.role === 'vendor') {
    redirect('/vendor/dashboard');
  } else if (profile.role === 'sales_executive') {
    redirect('/sales/dashboard');
  } else {
    redirect('/unauthorized');
  }
}
