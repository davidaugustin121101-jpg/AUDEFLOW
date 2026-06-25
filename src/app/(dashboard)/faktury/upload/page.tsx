import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DropZone } from '@/components/invoices/DropZone'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function UploadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accountingConn } = await supabase
    .from('accounting_connections')
    .select('id, provider')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/faktury"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na faktury
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nahrát fakturu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Přetáhni PDF fakturu – Claude ji přečte a navrhne účetní kód do 5 sekund.
        </p>
      </div>

      {!accountingConn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Upozornění:</strong> Nemáš připojený žádný fakturační systém. Fakturu
            sice zpracujeme, ale nebudeš ji moct odeslat do účetnictví.{' '}
            <Link href="/settings/accounting" className="underline font-medium">
              Nastavit teď →
            </Link>
          </p>
        </div>
      )}

      <DropZone />

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jak to funguje</p>
        <ol className="space-y-1.5 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 w-4 shrink-0">1.</span>
            Přetáhni PDF fakturu od dodavatele
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 w-4 shrink-0">2.</span>
            Claude AI přečte fakturu a navrhne účetní kód
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 w-4 shrink-0">3.</span>
            Zkontroluj a uprav data, poté odešli jedním kliknutím
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 w-4 shrink-0">4.</span>
            Faktura je automaticky zaevidována v{' '}
            {accountingConn
              ? accountingConn.provider === 'idoklad'
                ? 'iDokladu'
                : 'Fakturoidu'
              : 'tvém účetním systému'}
          </li>
        </ol>
        <p className="text-xs text-gray-400 pt-1">
          PDF soubor není nikde uložen. Pracujeme pouze s extrahovanými daty.
        </p>
      </div>
    </div>
  )
}
