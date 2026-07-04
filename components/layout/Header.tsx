import { Bell, Menu, Moon, Search, User } from 'lucide-react'
import { Button } from '../Button'
import { Input } from '../Input'

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="lg:hidden text-gray-500" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="hidden md:flex relative max-w-md w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search products, vendors, customers..." 
            className="w-full bg-gray-50 pl-9 border-gray-200 focus-visible:ring-blue-500 rounded-full" 
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="text-gray-500 rounded-full hover:bg-gray-100">
          <Moon className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-500 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
        </div>
        <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-gray-200 ml-1 sm:ml-2">
          <button className="flex items-center gap-2 rounded-full hover:bg-gray-50 p-1 pr-2 transition-colors">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              AD
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">Admin User</span>
          </button>
        </div>
      </div>
    </header>
  )
}
