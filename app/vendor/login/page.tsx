'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { ArrowLeft } from 'lucide-react';

export default function VendorLoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="w-full max-w-md">
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl p-8">
          <div className="space-y-1 pb-6 text-center">
            <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-blue-400 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Vendor Login</h2>
            <p className="text-gray-400">
              Enter your credentials to access the vendor portal
            </p>
          </div>
          <div>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="expected_role" value="vendor" />
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                  <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                />
              </div>

              {state?.error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-sm text-red-400 text-center">
                  {state.error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11"
                disabled={pending}
              >
                {pending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
