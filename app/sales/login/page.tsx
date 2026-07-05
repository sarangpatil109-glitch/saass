'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { ArrowLeft } from 'lucide-react';

export default function SalesLoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="w-full max-w-md">
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl p-8">
          <div className="space-y-1 pb-6 text-center">
            <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-purple-400 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Sales Executive Login</h2>
            <p className="text-gray-400">
              Enter your credentials to access the sales portal
            </p>
          </div>
          <div>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="expected_role" value="sales_executive" />
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="sales@example.com"
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                  <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                />
              </div>

              {state?.error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-sm text-red-400 text-center">
                  {state.error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white h-11"
                disabled={pending}
              >
                {pending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/sales/register" className="text-purple-400 hover:text-purple-300 font-medium">
                Create New Account
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
