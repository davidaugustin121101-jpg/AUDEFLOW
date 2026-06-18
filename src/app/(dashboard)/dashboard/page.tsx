import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Package, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(name, plan)')
    .eq('id', user.id)
    .single()

  const companyId = profile?.company_id

  const [
    { count: pricelistCount },
    { count: productCount },
    { count: quoteCount },
  ] = await Promise.all([
    supabase.from('pricelist_files').select('*', { count: 'exact', head: true }).eq('company_id', companyId ?? '').eq('status', 'ready'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('company_id', companyId ?? ''),
    supabase.from('quote_sessions').select('*', { count: 'exact', head: true }).eq('company_id', companyId ?? ''),
  ])

  const { data: recentQuotes } = await supabase
    .from('quote_sessions')
    .select('id, email_subject, status, created_at')
    .eq('company_id', companyId ?? '')
    .order('created_at', { ascending: false })
    .limit(5)

  const company = (Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies) as { name: string; plan: string } | null
  const planLabel = { start: 'START', business: 'BUSINESS', enterprise: 'ENTERPRISE' }[company?.plan ?? 'start'] ?? 'START'

  const stats = [
    { label: 'Aktivní ceníky', value: pricelistCount ?? 0, icon: FileSpreadsheet, color: 'text-blue-600 bg-blue-50' },
    { label: 'Produktů v databázi', value: (productCount ?? 0).toLocaleString('cs'), icon: Package, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Vygenerovaných nabídek', value: quoteCount ?? 0, icon: MessageSquare, color: 'text-violet-600 bg-violet-50' },
    { label: 'Ušetřeno hodin (est.)', value: `~${Math.round((quoteCount ?? 0) * 0.5)}`, icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
  ]

  const statusColor: Record<string, string> = {
    draft: 'secondary',
    sent: 'default',
    accepted: 'default',
    rejected: 'destructive',
  }
  const statusLabel: Record<string, string> = {
    draft: 'Koncept',
    sent: 'Odesláno',
    accepted: 'Přijato',
    rejected: 'Odmítnuto',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Přehled</h1>
          <p className="text-gray-500 mt-1">{company?.name ?? 'Vaše firma'}</p>
        </div>
        <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200 text-sm px-3 py-1">
          {planLabel}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-none border-gray-200">
            <CardContent className="p-5">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Rychlé akce</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/pricelist/upload">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-sm">Nahrát ceník</div>
                  <div className="text-xs text-gray-400">Excel nebo CSV soubor</div>
                </div>
              </Button>
            </Link>
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
              <p className="text-sm text-gray-500 font-medium">Outlook / Gmail Add-in</p>
              <p className="text-xs text-gray-400 mt-1">Instalace dostupná v nastavení</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent quotes */}
        <Card className="shadow-none border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Poslední nabídky</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentQuotes?.length ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Zatím žádné nabídky</p>
                <p className="text-xs text-gray-400 mt-1">Aktivujte add-in v Outlooku nebo Gmailu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentQuotes.map((q) => (
                  <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {q.email_subject ?? 'Bez předmětu'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleDateString('cs-CZ')}
                      </p>
                    </div>
                    <Badge variant={statusColor[q.status] as 'secondary' | 'default' | 'destructive'} className="ml-3 shrink-0 text-xs">
                      {statusLabel[q.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
