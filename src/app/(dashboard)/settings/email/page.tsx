import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { EmailConnection } from '@/types/invoices'
import { EmailConnectionManager } from './EmailConnectionManager'

export default async function EmailSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: connections } = await supabase
    .from('email_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emailová připojení</h1>
        <p className="text-sm text-gray-500 mt-1">
          Spravujte emaily, ze kterých zpracováváme faktury.
        </p>
      </div>
      <EmailConnectionManager
        connections={(connections ?? []) as EmailConnection[]}
      />
    </div>
  )
}
