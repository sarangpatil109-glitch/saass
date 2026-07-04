import { Card } from '@/components/Card'
import { Activity, Users, DollarSign, CheckCircle } from 'lucide-react'

const stats = [
  { name: 'My Customers', stat: '42', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: "Today's Sales", stat: '$150', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Monthly Sales', stat: '$1,200', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'Commission Earned', stat: '$350', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Pending Commission', stat: '$120', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'Completed Sales', stat: '18', icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
]

export default function SalesExecDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track your performance and manage your customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-6 mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start pb-4 border-b">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New Customer Assigned</p>
                <p className="text-xs text-gray-500">Alex Johnson was assigned to your pipeline.</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sale Completed</p>
                <p className="text-xs text-gray-500">Closed $150 plan with Sarah Williams.</p>
                <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
