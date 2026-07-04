$pages = @{
    "app\(dashboard)\admin\reports\page.tsx" = "export default function ReportsPage() { return <div><h1 className='text-2xl font-bold'>Reports Dashboard</h1><p>Select a report to view.</p></div> }"
    "app\(dashboard)\admin\settings\page.tsx" = "export default function SettingsPage() { return <div><h1 className='text-2xl font-bold'>Settings</h1><p>Configure platform settings.</p></div> }"
    "app\(dashboard)\admin\logs\page.tsx" = "import { Card } from '@/components/Card'; import { Input } from '@/components/Input'; import { Select } from '@/components/Select'; export default function LogsPage() { return <div className='space-y-6'><div><h1 className='text-2xl font-bold text-gray-900'>Activity Logs</h1><p className='text-sm text-gray-500 mt-1'>View and filter platform activities.</p></div><Card className='p-6'><div className='flex gap-4 mb-6'><Input placeholder='Search logs...' className='max-w-xs' /><Select defaultValue='all'><option value='all'>All Roles</option><option value='admin'>Admin</option><option value='vendor'>Vendor</option></Select></div><div className='text-center py-12 text-gray-500'>Log viewer foundation ready.</div></Card></div> }"
}

foreach ($path in $pages.Keys) {
    $dir = Split-Path $path -Parent
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    Set-Content -Path $path -Value $pages[$path]
}
