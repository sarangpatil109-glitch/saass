import React from 'react'
import { ResponsiveSidebar } from './ResponsiveSidebar'

export function SalesLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { name: 'Dashboard', href: '/sales/dashboard', iconName: 'dashboard' },
    { name: 'Assigned Leads', href: '/sales/leads', iconName: 'users' },
    { name: 'Customers', href: '/sales/customers', iconName: 'store' },
    { name: 'Orders', href: '/sales/orders', iconName: 'packagesearch' },
    { name: 'Commission', href: '/sales/commission', iconName: 'percent' },
    { name: 'Follow-ups', href: '/sales/followups', iconName: 'piechart' },
    { name: 'Profile', href: '/sales/profile', iconName: 'settings' },
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
