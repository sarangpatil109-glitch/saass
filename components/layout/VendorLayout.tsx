import React from 'react'
import { ResponsiveSidebar } from './ResponsiveSidebar'

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { name: 'Dashboard', href: '/vendor/dashboard', iconName: 'dashboard' },
    { name: 'Sales Executives', href: '/vendor/team', iconName: 'briefcase' },
    { name: 'Leads', href: '/vendor/leads', iconName: 'users' },
    { name: 'Orders', href: '/vendor/orders', iconName: 'packagesearch' },
    { name: 'Commission', href: '/vendor/commission', iconName: 'percent' },
    { name: 'Reports', href: '/vendor/reports', iconName: 'piechart' },
    { name: 'Profile', href: '/vendor/profile', iconName: 'settings' },
    { name: 'Settings', href: '/vendor/settings', iconName: 'settings' },
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
