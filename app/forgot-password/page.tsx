'use client'

import { useState } from 'react'
import { resetPassword } from '@/app/actions/auth'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    
    const formData = new FormData()
    formData.append('email', email)
    
    const res = await resetPassword(formData)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
        </Link>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Enter your email and we'll send you a reset link</p>
        </div>

        <Card className="p-8 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900 rounded-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Check your email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full justify-center py-2.5">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Sending link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
