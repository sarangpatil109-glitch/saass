'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LogOut,
  X,
  LayoutDashboard, 
  PackageSearch, 
  Users, 
  Store, 
  Briefcase, 
  Percent, 
  Banknote,
  PieChart, 
  Settings
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { useSidebar } from '@/components/layout/SidebarContext'

const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  packagesearch: PackageSearch,
  users: Users,
  store: Store,
  briefcase: Briefcase,
  percent: Percent,
  banknote: Banknote,
  piechart: PieChart,
  settings: Settings,
}

export interface SidebarLink {
  name: string
  href: string
  iconName: string
}

export function ResponsiveSidebar({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname()
  const { isSidebarOpen, closeSidebar } = useSidebar()

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[9998] md:hidden" 
          onClick={closeSidebar}
        />
      )}

      <aside 
        className={`
          flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
          transition-transform duration-300 ease-in-out
          fixed top-0 left-0 h-screen w-[280px] z-[9999]
          md:translate-x-0 md:flex md:w-64 md:z-20 md:pt-16
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-gray-200 dark:border-gray-800">
          <span className="text-xl font-bold text-gray-900 dark:text-white">Menu</span>
          <button 
            onClick={closeSidebar}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const Icon = ICONS[link.iconName] || LayoutDashboard
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={closeSidebar}
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
            closeSidebar()
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
    </>
  )
}
