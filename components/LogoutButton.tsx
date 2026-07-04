'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </button>
  )
}
