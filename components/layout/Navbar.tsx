'use client'

import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { Search, Bell, Menu, X, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { useSidebar } from '@/components/layout/SidebarContext'

export function Navbar() {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  
  const pathname = usePathname()
  
  // Breadcrumb generator
  const paths = pathname?.split('/').filter(Boolean) || []
  const title = paths.length > 0 ? paths[paths.length - 1].replace(/-/g, ' ') : 'Dashboard'

  return (
    <nav className="fixed top-0 z-30 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 transition-colors">
      <div className="px-3 py-3 lg:px-5 lg:pl-3 flex items-center justify-between h-full">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mr-2"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/dashboard" className="flex items-center ml-2 md:mr-24">
            <span className="self-center text-xl font-bold sm:text-2xl whitespace-nowrap text-gray-900 dark:text-white tracking-tight">SAASS</span>
          </Link>
          
          {/* Breadcrumb - Desktop Only */}
          <div className="hidden md:flex items-center ml-8 text-sm text-gray-500 dark:text-gray-400 capitalize space-x-2">
            <span>Admin</span>
            <span>/</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Global Search */}
          <div className="hidden sm:block relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search (Ctrl+K)" 
              className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64 transition-all text-gray-900 dark:text-gray-100"
            />
          </div>

          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false) }}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                </div>
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No new notifications.
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false) }}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <User className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-50 py-1">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                </div>
                <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">My Account</Link>
                <Link href="/reset-password" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Change Password</Link>
                <button 
                  onClick={async () => {
                    await logout()
                    window.location.href = '/login'
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}
