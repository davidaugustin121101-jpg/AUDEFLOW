'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AccountingConnection } from '@/types/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type NewProvider = 'idoklad' | 'fakturoid' | null
type IdokladMode = 'oauth2' | 'token'

interface Props {
  connections: AccountingConnection[]
}

export function AccountingConnectionManager({ connections }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState<NewProvider>(null)
  const [idokladMode, setIdokladMode] = useState<IdokladMode>('oauth2')

  // iDoklad OAuth2
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  // iDoklad legacy / Fakturoid
  const [apiKey, setApiKey] = useState('')
  // Fakturoid
  const [accountSlug, setAccountSlug] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  function reset() {
    setAdding(null)
    setClientId('')
    setClientSecret('')
    setApiKey('')
    setAccountSlug('')
    setIdokladMode('oauth2')
  }

  async function handleSave() {
    if (!adding) return

    if (adding === 'idoklad') {
      if (idokladMode === 'oauth2' && (!clientId || !clientSecret)) {
        toast.error('Vyplňte Client ID a Client Secret')
        return
      }
      if (idokladMode === 'token' && !apiKey) {
        toast.error('Vyplňte Bearer token')
        return
      }
    }
    if (adding === 'fakturoid' && (!accountSlug || !apiKey)) {
      toast.error('Vyplňte slug účtu a OAuth token')
      return
    }

    setSaving(true)
    const body =
      adding === 'idoklad'
        ? idokladMode === 'oauth2'
          ? { provider: 'idoklad', clientId, clientSecret }
          : { provider: 'idoklad', apiKey }
        : { provider: 'fakturoid', apiKey, accountSlug }

    const res = await fetch('/api/accounting/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Nepodařilo se ověřit přihlašovací údaje')
      return
    }

    toast.success('Fakturační systém připojen')
    reset()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/accounting-connections/${id}`, { method: 'DELETE' })
    setDeleting(null)
    toast.success('Připojení odstraněno')
    router.refresh()
  }

  const PROVIDER_CONFIG = {
    idoklad: { label: 'iDoklad', emoji: '🧾', bg: 'bg-blue-50', text: 'text-blue-700' },
    fakturoid: { label: 'Fakturoid', emoji: '📊', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  }

  return (
    <div className="space-y-4">
      {/* Existing connections */}
      {connections.length === 0 && !adding ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Žádný fakturační systém nepřipojen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => {
            const cfg = PROVIDER_CONFIG[conn.provider]
            return (
              <div
                key={conn.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200"
              >
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-lg', cfg.bg)}>
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', cfg.text)}>{cfg.label}</p>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  </div>
                  {conn.account_slug && (
                    <p className="text-xs text-gray-400 mt-0.5">Slug: {conn.account_slug}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-600"
                  onClick={() => handleDelete(conn.id)}
                  disabled={deleting === conn.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add form */}
      {adding ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">
            Přidat {PROVIDER_CONFIG[adding].label}
          </p>

          {/* iDoklad form */}
          {adding === 'idoklad' && (
            <>
              {/* Mode selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIdokladMode('oauth2')}
                  className={cn(
                    'flex-1 text-xs font-medium py-2 px-3 rounded-lg border transition-colors',
                    idokladMode === 'oauth2'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  OAuth2 (doporučeno)
                </button>
                <button
                  onClick={() => setIdokladMode('token')}
                  className={cn(
                    'flex-1 text-xs font-medium py-2 px-3 rounded-lg border transition-colors',
                    idokladMode === 'token'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  Bearer token (legacy)
                </button>
              </div>

              {idokladMode === 'oauth2' ? (
                <>
                  <div>
                    <Label htmlFor="client-id">Client ID</Label>
                    <Input
                      id="client-id"
                      placeholder="z iDoklad → Nastavení → API → OAuth2"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <Input
                      id="client-secret"
                      type="password"
                      placeholder="z iDoklad → Nastavení → API → OAuth2"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Najdete v iDoklad → Nastavení → API přístupy → Nová aplikace
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="api-key-idoklad">Bearer token</Label>
                  <Input
                    id="api-key-idoklad"
                    type="password"
                    placeholder="z iDoklad → Nastavení → API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}

          {/* Fakturoid form */}
          {adding === 'fakturoid' && (
            <>
              <div>
                <Label htmlFor="slug">Slug účtu</Label>
                <Input
                  id="slug"
                  placeholder="nazev-firmy"
                  value={accountSlug}
                  onChange={(e) => setAccountSlug(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Z URL: app.fakturoid.cz/api/v3/accounts/<strong>slug</strong>/...
                </p>
              </div>
              <div>
                <Label htmlFor="api-key-fakturoid">OAuth token</Label>
                <Input
                  id="api-key-fakturoid"
                  type="password"
                  placeholder="z Fakturoid → Nastavení → API"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={reset}>
              Zrušit
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Ověřuji…' : 'Připojit'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Přidat fakturační systém</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding('idoklad')}
              className="gap-2"
              disabled={connections.some((c) => c.provider === 'idoklad')}
            >
              <Plus className="h-3.5 w-3.5" />
              iDoklad
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdding('fakturoid')}
              className="gap-2"
              disabled={connections.some((c) => c.provider === 'fakturoid')}
            >
              <Plus className="h-3.5 w-3.5" />
              Fakturoid
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
