import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const devMode = process.env.DEVELOPMENT_MODE === 'true';
  let userRole = 'admin';

  if (!devMode) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single();
    if (!profile || profile.status === 'suspended' || profile.status === 'inactive') {
      redirect('/login');
    }

    userRole = profile.role;
    
    // Ensure the user role is authorized for the dashboard layout
    if (!['admin', 'vendor', 'sales_executive', 'customer'].includes(userRole)) {
      redirect('/login');
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <Navbar />
        <div className="flex pt-16 h-full">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
