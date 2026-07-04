import { Card } from '@/components/Card'
import { Activity, Users, DollarSign, Briefcase } from 'lucide-react'

const stats = [
  { name: 'Total Sales Execs', stat: '4', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Total Customers', stat: '128', icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
  { name: 'Total Sales', stat: '$14,200', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: "Today's Sales", stat: '$450', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Monthly Sales', stat: '$3,200', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'Total Commission', stat: '$1,420', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'Pending Commission', stat: '$320', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'Paid Commission', stat: '$1,100', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-100' },
]

export default function VendorDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening with your team.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="text-gray-400">Chart Placeholder</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Execs</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="text-gray-400">Leaderboard Placeholder</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
