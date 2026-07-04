import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

export default function VendorProfilePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and security.</p>
      </div>

      <Card className="p-6">
        <form className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border">
              <span className="text-gray-400">IMG</span>
            </div>
            <div>
              <Button type="button" variant="outline" size="sm">Change Photo</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input disabled defaultValue="GymPro Fitness" className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Code</label>
              <Input disabled defaultValue="VND-XY98A" className="bg-gray-50 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <Input disabled defaultValue="Jane Smith" className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input disabled defaultValue="jane@gympro.com" className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Editable)</label>
              <Input defaultValue="+1 555-0921" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address (Editable)</label>
              <Input defaultValue="123 Fitness St" />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <Input type="password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <Input type="password" />
          </div>
          <div className="pt-2">
            <Button variant="outline">Update Password</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
