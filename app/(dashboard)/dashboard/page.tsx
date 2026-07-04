import { Card } from '@/components/Card'
import { Activity, Archive, Briefcase, Building2, DollarSign, Key, Users } from 'lucide-react'

const stats = [
  { name: 'Total Products', stat: '24', icon: Archive, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Total Vendors', stat: '12', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Sales Execs', stat: '8', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'Total Customers', stat: '1,429', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
  { name: "Today's Sales", stat: '$2,400', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Monthly Revenue', stat: '$42,000', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'Pending ZIPs', stat: '5', icon: FileIcon, color: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'Generated ZIPs', stat: '142', icon: Archive, color: 'text-teal-600', bg: 'bg-teal-100' },
  { name: 'Active Licenses', stat: '1,390', icon: Key, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  { name: 'Suspended Licenses', stat: '39', icon: Key, color: 'text-red-600', bg: 'bg-red-100' },
]

function FileIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

const activities = [
  { id: 1, text: 'Admin user logged in', date: '2 mins ago', type: 'login' },
  { id: 2, text: 'Vendor "GymPro" created', date: '1 hour ago', type: 'vendor' },
  { id: 3, text: 'New Sales Executive added', date: '3 hours ago', type: 'sales' },
  { id: 4, text: 'License #9923 activated', date: '4 hours ago', type: 'license' },
  { id: 5, text: 'ZIP request generated for GymPro', date: '5 hours ago', type: 'zip' },
  { id: 6, text: 'License #8821 suspended', date: '1 day ago', type: 'license-suspend' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((item) => (
          <Card key={item.name} className="overflow-hidden p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 truncate">{item.name}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{item.stat}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <Card className="col-span-1 lg:col-span-2 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="text-gray-400">Chart Placeholder</span>
          </div>
        </Card>

        <Card className="col-span-1 p-6 flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
