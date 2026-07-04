$pages = @{
    "app\(dashboard)\dashboard\page.tsx" = "export default function DashboardPage() { return <div><h1 className='text-2xl font-bold'>Dashboard</h1><p className='mt-2'>Welcome to your dashboard.</p></div> }"
    "app\(dashboard)\admin\page.tsx" = "export default function AdminPage() { return <div><h1 className='text-2xl font-bold'>Admin Panel</h1></div> }"
    "app\(dashboard)\vendor\page.tsx" = "export default function VendorPage() { return <div><h1 className='text-2xl font-bold'>Vendor Portal</h1></div> }"
    "app\(dashboard)\sales\page.tsx" = "export default function SalesPage() { return <div><h1 className='text-2xl font-bold'>Sales Executive Portal</h1></div> }"
    "app\login\page.tsx" = "export default function LoginPage() { return <div className='flex h-screen items-center justify-center'><h1 className='text-2xl font-bold'>Login Page (Auth placeholder)</h1></div> }"
    "app\unauthorized\page.tsx" = "export default function UnauthorizedPage() { return <div className='flex h-screen items-center justify-center'><h1 className='text-2xl font-bold text-red-600'>403 - Unauthorized</h1></div> }"
    "app\not-found.tsx" = "export default function NotFound() { return <div className='flex h-screen items-center justify-center'><h1 className='text-2xl font-bold text-gray-500'>404 - Page Not Found</h1></div> }"
    "app\page.tsx" = "import { redirect } from 'next/navigation'; export default function RootPage() { redirect('/dashboard'); }"
}

foreach ($path in $pages.Keys) {
    $dir = Split-Path $path -Parent
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    Set-Content -Path $path -Value $pages[$path]
}
