'use client'

import { useState } from 'react'
import { registerSalesExecutive } from '@/app/actions/register'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    const res = await registerSalesExecutive(formData)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-500 mb-4">Registration Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your account has been created and is pending approval from your vendor. You will be able to log in once your account is activated.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full justify-center">
              Return to Login
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create an Account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Register as a Sales Executive</p>
        </div>

        <Card className="p-8 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <Input name="first_name" required disabled={loading} placeholder="John" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <Input name="last_name" required disabled={loading} placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <Input type="email" name="email" required disabled={loading} placeholder="you@example.com" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <Input type="tel" name="phone" required disabled={loading} placeholder="+1 234 567 8900" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Coupon Code</label>
              <Input name="coupon_code" required disabled={loading} placeholder="VEND123" className="uppercase font-mono" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  className="pr-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Already have an account? </span>
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
