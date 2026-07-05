'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerSalesExecutive } from '@/app/actions/register';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { ArrowLeft } from 'lucide-react';

export default function SalesRegisterPage() {
  const [state, formAction, pending] = useActionState(registerSalesExecutive, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      
      <div className="w-full max-w-xl my-8">
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl p-8">
          <div className="space-y-1 pb-6 text-center">
            <h2 className="text-3xl font-bold">Create Sales Account</h2>
            <p className="text-gray-400">
              Join the team and start tracking your sales and commissions.
            </p>
          </div>
          
          {state?.success ? (
            <div className="text-center py-8">
              <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Registration Successful!</h3>
              <p className="text-gray-300 mb-6">Your account has been created and is pending approval.</p>
              <Link href="/sales/login">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium text-gray-300">First Name</label>
                  <Input id="first_name" name="first_name" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium text-gray-300">Last Name</label>
                  <Input id="last_name" name="last_name" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                  <Input id="email" name="email" type="email" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-300">Phone</label>
                  <Input id="phone" name="phone" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="coupon_code" className="text-sm font-medium text-gray-300">Vendor Coupon Code</label>
                <Input id="coupon_code" name="coupon_code" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" placeholder="Ask your vendor for this code" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                  <Input id="password" name="password" type="password" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-medium text-gray-300">Confirm Password</label>
                  <Input id="confirm_password" name="confirm_password" type="password" required className="bg-gray-900/50 border-gray-700 text-white focus-visible:ring-purple-500" />
                </div>
              </div>

              {state?.error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-sm text-red-400 text-center">
                  {state.error}
                </div>
              )}

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white h-11" disabled={pending}>
                {pending ? 'Creating Account...' : 'Create Account'}
              </Button>
              
              <div className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/sales/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
