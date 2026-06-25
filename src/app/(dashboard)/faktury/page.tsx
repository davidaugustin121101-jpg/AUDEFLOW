import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProcessedInvoice } from '@/types/invoices'
import { InvoiceList } from '@/components/invoices/InvoiceList'
import { FileText, Clock, CheckCircle2, TrendingUp, Upload } from 'lucide-react'
import Link from 'next/link'

export default async function FakturyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ data: pending }, { data: thisMonth }, { data: allInvoices }] =
    await Promise.all([
      supabase
        .from('processed_invoices')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending_review', 'needs_manual_check'])
        .order('created_at', { ascending: false }),
      supabase
        .from('processed_invoices')
        .select('id, castka_celkem, status')
        .eq('user_id', user.id)
        .gte('created_at', firstOfMonth),
      supabase
        .from('processed_invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'sent_to_accounting')
        .order('processed_at', { ascending: false })
        .limit(20),
    ])

  const totalThisMonth = thisMonth?.length ?? 0
  const sentThisMonth = thisMonth?.filter((i) => i.status === 'sent_to_accounting').length ?? 0
  const savedHours = Math.round((sentThisMonth * 5) / 60 * 10) / 10

  const pendingInvoices = (pending ?? []) as ProcessedInvoice[]
  const processedInvoices = (allInvoices ?? []) as ProcessedInvoice[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faktury</h1>
          <p className="text-sm text-gray-500 mt-1">Zpracování přijatých faktur – přetáhni PDF nebo propoj email</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings/email"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Nastavení
          </Link>
          <Link
            href="/faktury/upload"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Upload className="h-4 w-4" />
            Nahrát fakturu
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          label="Tento měsíc"
          value={String(totalThisMonth)}
          sub="faktur přijato"
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Odesláno"
          value={String(sentThisMonth)}
          sub="do účetnictví"
          color="green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          label="Čeká"
          value={String(pendingInvoices.length)}
          sub="ke schválení"
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          label="Ušetřeno"
          value={`~${savedHours} h`}
          sub="práce tento měsíc"
          color="purple"
        />
      </div>

      {/* Pending invoices */}
      {pendingInvoices.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-gray-900">Ke schválení</h2>
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
              {pendingInvoices.length}
            </span>
          </div>
          <InvoiceList invoices={pendingInvoices} />
        </section>
      )}

      {/* Processed invoices */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Zpracované (tento měsíc)
        </h2>
        <InvoiceList
          invoices={processedInvoices}
          emptyMessage="Zatím žádné zpracované faktury tento měsíc"
          compact
        />
      </section>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
  const bg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
  }[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
