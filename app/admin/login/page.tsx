'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { ShieldAlert } from 'lucide-react';

export default function SecureAdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-950 border-gray-800 text-white shadow-2xl p-8">
          <div className="space-y-1 pb-6 text-center">
            <div className="bg-red-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-red-500 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Secure Access</h2>
            <p className="text-gray-500 text-sm">
              Restricted portal. Unauthorized access is prohibited.
            </p>
          </div>
          <div>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="expected_role" value="admin" />
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium text-gray-400 uppercase tracking-wider">Identifier</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="bg-gray-900 border-gray-800 text-white focus-visible:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-medium text-gray-400 uppercase tracking-wider">Passphrase</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="bg-gray-900 border-gray-800 text-white focus-visible:ring-red-500"
                />
              </div>

              {state?.error && (
                <div className="p-3 rounded-md bg-red-950/50 border border-red-900 text-sm text-red-400 text-center">
                  {state.error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11 transition-colors"
                disabled={pending}
              >
                {pending ? 'Authenticating...' : 'Authorize'}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
