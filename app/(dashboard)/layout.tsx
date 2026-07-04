import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const devMode = process.env.DEVELOPMENT_MODE === 'true';
  let userRole = 'admin';

  if (!devMode) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single();
    if (!profile || !(profile.role === 'admin' || profile.role === 'vendor' || profile.role === 'sales_executive')) {
      redirect('/login');
    }
    userRole = profile.role;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar />
      <div className="flex pt-16 h-full">
        <Sidebar userRole={userRole} />
        <main className="w-full md:ml-64 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
