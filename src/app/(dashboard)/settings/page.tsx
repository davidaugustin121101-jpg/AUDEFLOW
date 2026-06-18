import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Mail, Globe, ExternalLink, Download, Zap } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(name, plan, slug)')
    .eq('id', user.id)
    .single()

  const company = profile?.companies as { name: string; plan: string; slug: string } | null
  const planLabel = { start: 'START', business: 'BUSINESS', enterprise: 'ENTERPRISE' }[company?.plan ?? 'start'] ?? 'START'

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nastavení</h1>
        <p className="text-gray-500 mt-1">Správa účtu, firmy a e-mailových add-inů</p>
      </div>

      {/* Account */}
      <Card className="shadow-none border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Účet a firma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">E-mail</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Jméno</p>
              <p className="font-medium text-gray-900">{profile?.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Firma</p>
              <p className="font-medium text-gray-900">{company?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Plán</p>
              <Badge variant="secondary" className="text-blue-700 bg-blue-50 border-blue-200">{planLabel}</Badge>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <Button variant="outline" size="sm">Změnit heslo</Button>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Upgradovat plán
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add-ins */}
      <Card className="shadow-none border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">E-mailové Add-iny</CardTitle>
          <CardDescription>Nainstalujte Audeflow AI přímo do vaší e-mailové schránky</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Outlook */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="h-10 w-10 rounded-xl bg-[#0078d4] flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm">Microsoft Outlook</p>
                <Badge variant="secondary" className="text-xs">Office Add-in</Badge>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Funguje v Outlook Web, Desktop (Windows/Mac) a v mobilní aplikaci.
                Instalace přes Microsoft AppSource nebo manifest XML.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled>
                  <ExternalLink className="h-3 w-3" />
                  AppSource (brzy)
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled>
                  <Download className="h-3 w-3" />
                  Stáhnout manifest XML
                </Button>
              </div>
            </div>
          </div>

          {/* Gmail */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900 text-sm">Gmail / Google Workspace</p>
                <Badge variant="secondary" className="text-xs">Workspace Add-on</Badge>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Boční panel přímo v Gmailu. Instalace přes Google Workspace Marketplace.
                Vyžaduje schválení správce Google Workspace (pro firemní účty).
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled>
                  <ExternalLink className="h-3 w-3" />
                  Workspace Marketplace (brzy)
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
            <Zap className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Add-iny jsou ve vývoji</p>
              <p className="text-xs text-blue-700 mt-0.5">
                E-mailové add-iny budou dostupné v Q1 2025. Pro pilotní přístup nás kontaktujte na{' '}
                <a href="mailto:hello@audeflow.ai" className="underline">hello@audeflow.ai</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API */}
      <Card className="shadow-none border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">API přístup</CardTitle>
          <CardDescription>Pro vlastní integraci nebo napojení na ERP</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">API klíč</p>
              <p className="text-xs text-gray-400">Dostupný v plánu BUSINESS a výše</p>
            </div>
            <Button variant="outline" size="sm" disabled>Vygenerovat klíč</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
