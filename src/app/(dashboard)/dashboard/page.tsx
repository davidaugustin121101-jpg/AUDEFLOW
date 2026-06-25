import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FileText, Clock, CheckCircle2, TrendingUp, Upload, Settings, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: pending },
    { data: thisMonth },
    { data: recentInvoices },
    { data: accountingConn },
    { data: emailConn },
  ] = await Promise.all([
    supabase
      .from('processed_invoices')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .in('status', ['pending_review', 'needs_manual_check']),
    supabase
      .from('processed_invoices')
      .select('id, castka_celkem, status')
      .eq('user_id', user.id)
      .gte('created_at', firstOfMonth),
    supabase
      .from('processed_invoices')
      .select('id, dodavatel_nazev, castka_celkem, status, created_at, ucetni_kod')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('accounting_connections')
      .select('id, provider')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('email_connections')
      .select('id, provider, email_address')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  const totalThisMonth = thisMonth?.length ?? 0
  const sentThisMonth = thisMonth?.filter((i) => i.status === 'sent_to_accounting').length ?? 0
  const pendingCount = pending?.length ?? 0
  const savedHours = Math.round((sentThisMonth * 7) / 60 * 10) / 10

  const isReady = !!accountingConn

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Přehled</h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.email}
        </p>
      </div>

      {/* Setup banner */}
      {!isReady && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Připoj fakturační systém pro první fakturu
          </p>
          <p className="text-sm text-blue-700 mb-4">
            Nastav iDoklad nebo Fakturoid – zabere to 1 minutu.
          </p>
          <div className="flex gap-3">
            <Link
              href="/settings/accounting"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Settings className="h-4 w-4" />
              Nastavit iDoklad / Fakturoid
            </Link>
            <Link
              href="/faktury/upload"
              className="inline-flex items-center gap-2 border border-blue-200 text-blue-700 hover:bg-blue-100 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              Nahrát fakturu bez připojení →
            </Link>
          </div>
        </div>
      )}

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
          value={String(pendingCount)}
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

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/faktury/upload"
          className="flex items-center gap-4 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-2xl p-5 transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Nahrát fakturu</p>
            <p className="text-xs text-gray-500 mt-0.5">PDF → Claude AI → iDoklad</p>
          </div>
        </Link>

        {emailConn ? (
          <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Email aktivní</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {emailConn.email_address} · kontrola každých 15 min
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/onboarding"
            className="flex items-center gap-4 bg-white border border-dashed border-gray-300 hover:border-blue-300 rounded-2xl p-5 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Mail className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Propojit email</p>
              <p className="text-xs text-gray-400 mt-0.5">Gmail, Outlook nebo IMAP</p>
            </div>
          </Link>
        )}
      </div>

      {/* Recent invoices */}
      {(recentInvoices?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Poslední faktury</h2>
            <Link href="/faktury" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Zobrazit vše →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {recentInvoices!.map((inv) => (
              <Link
                key={inv.id}
                href={`/faktury/${inv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {inv.dodavatel_nazev ?? 'Neznámý dodavatel'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inv.ucetni_kod && (
                      <span className="font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mr-2">
                        {inv.ucetni_kod}
                      </span>
                    )}
                    {new Intl.DateTimeFormat('cs-CZ').format(new Date(inv.created_at))}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {inv.castka_celkem != null && (
                    <p className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(inv.castka_celkem)}
                    </p>
                  )}
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
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
  const bg = { blue: 'bg-blue-50', green: 'bg-green-50', yellow: 'bg-yellow-50', purple: 'bg-purple-50' }[color]
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_review: { label: 'Čeká', cls: 'bg-yellow-50 text-yellow-700' },
    needs_manual_check: { label: 'Zkontrolovat', cls: 'bg-orange-50 text-orange-700' },
    sent_to_accounting: { label: 'Odesláno', cls: 'bg-green-50 text-green-700' },
    rejected: { label: 'Zamítnuto', cls: 'bg-gray-100 text-gray-500' },
    error: { label: 'Chyba', cls: 'bg-red-50 text-red-600' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  )
}
