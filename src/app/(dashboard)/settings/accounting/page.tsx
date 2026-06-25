import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AccountingConnection } from '@/types/invoices'
import { AccountingConnectionManager } from './AccountingConnectionManager'

export default async function AccountingSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: connections } = await supabase
    .from('accounting_connections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fakturační systémy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Připojte fakturační systém pro automatické odesílání zpracovaných faktur.
        </p>
      </div>
      <AccountingConnectionManager
        connections={(connections ?? []) as AccountingConnection[]}
      />
    </div>
  )
}
