import { Card } from '@/components/Card'
import { Target, TrendingUp, TrendingDown, Clock, AlertCircle, Users, CheckCircle, Calendar } from 'lucide-react'

const metrics = [
  { name: 'Total Leads', stat: '1,248', icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: "Today's Leads", stat: '24', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { name: 'Won Leads', stat: '412', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Lost Leads', stat: '186', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
  { name: 'Pending Follow-ups', stat: '84', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: "Today's Follow-ups", stat: '32', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'Overdue Follow-ups', stat: '12', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  { name: 'New Customers', stat: '15', icon: Users, color: 'text-teal-600', bg: 'bg-teal-100' },
]

export default function CRMDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CRM Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time overview of your lead pipeline and follow-ups.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline Value</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="text-gray-400">Pipeline Chart Placeholder</span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Overdue Follow-ups</h3>
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No overdue follow-ups right now.
          </div>
        </Card>
      </div>
    </div>
  )
}
