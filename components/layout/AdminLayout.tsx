import React from 'react'
import { ResponsiveSidebar } from './ResponsiveSidebar'

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { name: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
    { name: 'Sales Requests', href: '/admin/sales-requests', iconName: 'packagesearch' },
    { name: 'Commissions', href: '/admin/commissions', iconName: 'percent' },
    { name: 'Commission Payouts', href: '/admin/commission-payouts', iconName: 'banknote' },
    { name: 'Products', href: '/dashboard/products', iconName: 'packagesearch' },
    { name: 'Customers', href: '/dashboard/customers', iconName: 'users' },
    { name: 'Vendors', href: '/dashboard/vendors', iconName: 'store' },
    { name: 'Sales Executives', href: '/dashboard/sales-executives', iconName: 'briefcase' },
    { name: 'Reports', href: '/admin/reports', iconName: 'piechart' },
    { name: 'Settings', href: '/admin/settings', iconName: 'settings' },
  ]

  return (
    <>
      <ResponsiveSidebar links={links} />
      <main className="w-full md:ml-64 p-4 lg:p-8 min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  )
}
