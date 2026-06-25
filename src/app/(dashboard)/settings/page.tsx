import { createClient } from '@/lib/supabase/server'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Building2, Mail, Receipt } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch plan from user_profiles if it exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, invoices_this_month')
    .eq('id', user.id)
    .maybeSingle()

  const plan = (profile as { plan?: string } | null)?.plan ?? 'free'
  const invoicesThisMonth = (profile as { invoices_this_month?: number } | null)?.invoices_this_month ?? 0

  const planLabel: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    pro: 'Pro',
  }
  const planLimit: Record<string, string> = {
    free: '10 faktur / měsíc',
    starter: '100 faktur / měsíc',
    pro: 'Neomezeno',
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-sm text-gray-500 mt-1">Správa účtu a napojení</p>
      </div>

      {/* Account card */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Účet</p>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Plán</p>
              <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">
                {planLabel[plan] ?? plan}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Limit faktur</p>
              <p className="font-medium text-gray-900">{planLimit[plan] ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Faktur tento měsíc</p>
              <p className="font-medium text-gray-900">{invoicesThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500">
            Pro upgrade plánu napište na{' '}
            <a href="mailto:podpora@audeflow.cz" className="text-blue-600 underline">
              podpora@audeflow.cz
            </a>
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Napojení</p>

        <Link
          href="/settings/accounting"
          className="flex items-center gap-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl p-4 transition-all group"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Fakturační systém</p>
            <p className="text-xs text-gray-500 mt-0.5">iDoklad nebo Fakturoid – přímé API napojení</p>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-blue-600">→</span>
        </Link>

        <Link
          href="/settings/email"
          className="flex items-center gap-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl p-4 transition-all group"
        >
          <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
            <Mail className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Email napojení</p>
            <p className="text-xs text-gray-500 mt-0.5">Gmail, Outlook nebo IMAP – automatická kontrola faktur</p>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-blue-600">→</span>
        </Link>
      </div>

      <Separator />

      <div className="text-xs text-gray-400 space-y-1">
        <p>Audeflow AI · <a href="https://audeflow.cz" className="underline">audeflow.cz</a></p>
        <p>Podpora: <a href="mailto:podpora@audeflow.cz" className="underline">podpora@audeflow.cz</a></p>
      </div>
    </div>
  )
}
