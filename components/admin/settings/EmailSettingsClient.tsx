'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Mail, Loader2, Send } from 'lucide-react'
import { sendTestEmail } from '@/app/actions/email_settings'

export function EmailSettingsClient() {
  const [testEmail, setTestEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail) return
    
    setIsSending(true)
    setMessage(null)
    
    const result = await sendTestEmail(testEmail)
    
    if (!result.success) {
      setMessage({ text: result.error || 'Failed to send test email', type: 'error' })
    } else {
      setMessage({ text: 'Test email sent successfully! Please check your inbox.', type: 'success' })
      setTestEmail('')
    }
    
    setIsSending(false)
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-5 w-5 text-blue-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">Email Notifications</h3>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        <div className="pt-2">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Send Test Email</h4>
          <form onSubmit={handleSendTest} className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address..."
              required
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={isSending || !testEmail}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Test
            </button>
          </form>
        </div>
      </div>
    </Card>
  )
}
