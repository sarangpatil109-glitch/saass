import Link from 'next/link'
import { Home, Users, Briefcase, DollarSign, Key, Archive, FileText, Settings, Building2, LogOut, Activity } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Products', href: '/admin/products', icon: Archive },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Vendors', href: '/admin/vendors', icon: Building2 },
  { name: 'Sales Executives', href: '/admin/sales', icon: Briefcase },
  { name: 'Commission', href: '/admin/commission', icon: DollarSign },
  { name: 'ZIP Generator', href: '/admin/zips', icon: FileText },
  { name: 'License Manager', href: '/admin/licenses', icon: Key },
  { name: 'Delivery History', href: '/admin/delivery', icon: Archive },
  { name: 'Reports', href: '/admin/reports', icon: FileText },
  { name: 'Activity Logs', href: '/admin/logs', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-gray-900 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <span className="text-xl font-bold text-white tracking-tight">SaaS Admin</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <nav className="flex-1 space-y-1 px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-gray-800 p-4">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut className="h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}
