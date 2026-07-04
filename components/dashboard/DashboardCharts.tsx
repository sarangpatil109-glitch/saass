'use client'

import { Card } from '@/components/Card'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { IndianRupee, Users } from 'lucide-react'

export function RevenueChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm h-[350px] flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
          <IndianRupee className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-gray-900 dark:text-white font-medium">No Revenue Data</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Check back later when orders are processed.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Revenue</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total processed revenue over time</p>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 600 }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function CustomerGrowthChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm h-[350px] flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-3">
          <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-gray-900 dark:text-white font-medium">No Customer Data</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">New customers will appear here.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Customer Growth</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">New customers acquired per month</p>
        </div>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
            <Tooltip 
              cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#111827', fontWeight: 600 }}
              formatter={(value: any) => [`${value}`, 'New Customers']}
            />
            <Bar dataKey="customers" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
