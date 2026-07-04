import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'

// Dummy data for team
const team = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-0101', status: 'active', joined: '2026-01-15', comm: '10%' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', status: 'active', joined: '2026-03-22', comm: '12%' },
]

export default function VendorTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Team</h1>
        <p className="text-sm text-gray-500 mt-1">View your linked Sales Executives.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joining Date</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{member.email}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{member.joined}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{member.comm}</td>
                  <td className="px-6 py-4">
                    <Badge className={member.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {member.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
