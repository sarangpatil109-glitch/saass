'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  PackageSearch, 
  Users, 
  Store, 
  Briefcase, 
  Percent, 
  FileArchive, 
  KeyRound, 
  PieChart, 
  Settings,
  LogOut,
  Banknote
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

export function Sidebar({ userRole = 'admin' }: { userRole?: string }) {
  const pathname = usePathname()

  let links: any[] = []

  if (userRole === 'admin') {
    links = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Sales Requests', href: '/admin/sales-requests', icon: PackageSearch },
      { name: 'Commissions', href: '/admin/commissions', icon: Percent },
      { name: 'Commission Payouts', href: '/admin/commission-payouts', icon: Banknote },
      { name: 'Products', href: '/dashboard/products', icon: PackageSearch },
      { name: 'Customers', href: '/dashboard/customers', icon: Users },
      { name: 'Vendors', href: '/dashboard/vendors', icon: Store },
      { name: 'Sales Executives', href: '/dashboard/sales-executives', icon: Briefcase },
      { name: 'Reports', href: '/admin/reports', icon: PieChart },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  } else if (userRole === 'vendor') {
    links = [
      { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
      { name: 'Sales Executives', href: '/vendor/team', icon: Briefcase },
      { name: 'Leads', href: '/vendor/leads', icon: Users },
      { name: 'Orders', href: '/vendor/orders', icon: PackageSearch },
      { name: 'Commission', href: '/vendor/commission', icon: Percent },
      { name: 'Reports', href: '/vendor/reports', icon: PieChart },
      { name: 'Profile', href: '/vendor/profile', icon: Settings },
      { name: 'Settings', href: '/vendor/settings', icon: Settings },
    ]
  } else if (userRole === 'sales_executive') {
    links = [
      { name: 'Dashboard', href: '/sales/dashboard', icon: LayoutDashboard },
      { name: 'Assigned Leads', href: '/sales/leads', icon: Users },
      { name: 'Customers', href: '/sales/customers', icon: Store },
      { name: 'Orders', href: '/sales/orders', icon: PackageSearch },
      { name: 'Commission', href: '/sales/commission', icon: Percent },
      { name: 'Follow-ups', href: '/sales/followups', icon: PieChart },
      { name: 'Profile', href: '/sales/profile', icon: Settings },
    ]
  }

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all z-20 hidden md:flex h-full fixed top-0 left-0 pt-16">
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
              {link.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={async () => {
            await logout()
            window.location.href = '/'
          }}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="flex-shrink-0 h-5 w-5 mr-3 text-red-500 dark:text-red-400" />
          Logout
        </button>
      </div>

    </aside>
  )
}
