'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Building2, Settings2, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type EmailProvider = 'gmail' | 'outlook' | 'imap' | null
type AccountingProvider = 'idoklad' | 'fakturoid' | null

const STEPS = [
  { id: 1, label: 'Email', icon: Mail },
  { id: 2, label: 'Fakturace', icon: Building2 },
  { id: 3, label: 'Nastavení', icon: Settings2 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [emailProvider, setEmailProvider] = useState<EmailProvider>(null)
  const [imapHost, setImapHost] = useState('')
  const [imapEmail, setImapEmail] = useState('')
  const [imapPassword, setImapPassword] = useState('')

  // Step 2
  const [accountingProvider, setAccountingProvider] =
    useState<AccountingProvider>(null)
  const [apiKey, setApiKey] = useState('')
  const [accountSlug, setAccountSlug] = useState('')

  // Step 3
  const [autoApproveBelow, setAutoApproveBelow] = useState('')
  const [notifyOnNew, setNotifyOnNew] = useState(true)

  async function handleStep1() {
    if (!emailProvider) {
      toast.error('Vyberte emailového poskytovatele')
      return
    }
    if (emailProvider === 'gmail') {
      const res = await fetch('/api/gmail/auth-url')
      const { url } = await res.json()
      window.location.href = url
      return
    }
    if (emailProvider === 'outlook') {
      const res = await fetch('/api/outlook/auth-url')
      const { url } = await res.json()
      window.location.href = url
      return
    }
    if (emailProvider === 'imap') {
      if (!imapHost || !imapEmail || !imapPassword) {
        toast.error('Vyplňte všechna pole pro IMAP')
        return
      }
      setLoading(true)
      const res = await fetch('/api/imap/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: imapHost, email: imapEmail, password: imapPassword }),
      })
      setLoading(false)
      if (!res.ok) {
        toast.error('Nepodařilo se připojit k IMAP serveru')
        return
      }
      setStep(2)
    }
  }

  async function handleStep2() {
    if (!accountingProvider) {
      toast.error('Vyberte fakturační systém')
      return
    }
    if (!apiKey) {
      toast.error('Zadejte API klíč / token')
      return
    }
    if (accountingProvider === 'fakturoid' && !accountSlug) {
      toast.error('Zadejte slug účtu Fakturoid')
      return
    }
    setLoading(true)
    const res = await fetch('/api/accounting/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: accountingProvider, apiKey, accountSlug }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Nepodařilo se ověřit API klíč')
      return
    }
    setStep(3)
  }

  async function handleStep3() {
    setLoading(true)
    await fetch('/api/invoices/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autoApproveBelow: autoApproveBelow ? Number(autoApproveBelow) : null,
        notifyOnNew,
      }),
    })
    setLoading(false)
    router.push('/faktury')
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">Nastavení automatického zpracování faktur</h1>
        <p className="text-gray-500 mt-2">Připojte svůj email a fakturační systém – celé to zabere 2 minuty.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, idx) => {
          const done = s.id < step
          const active = s.id === step
          const Icon = s.icon
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    done
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : active
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-gray-200 text-gray-400 bg-white'
                  )}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-20 h-0.5 mx-2 mb-5',
                    s.id < step ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <Card className="p-6">
        {/* STEP 1: Email */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Připoj svůj email</h2>
              <p className="text-sm text-gray-500">Budeme kontrolovat nové faktury ve vaší poště každých 15 minut.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <ProviderButton
                active={emailProvider === 'gmail'}
                onClick={() => setEmailProvider('gmail')}
                color="blue"
                emoji="🔵"
                label="Gmail (Google)"
                description="Přihlaste se přes Google účet"
              />
              <ProviderButton
                active={emailProvider === 'outlook'}
                onClick={() => setEmailProvider('outlook')}
                color="indigo"
                emoji="🔷"
                label="Outlook (Microsoft)"
                description="Přihlaste se přes Microsoft účet"
              />
              <ProviderButton
                active={emailProvider === 'imap'}
                onClick={() => setEmailProvider('imap')}
                color="gray"
                emoji="📧"
                label="Jiný email (IMAP)"
                description="Seznam, firemní doména, vlastní server"
              />
            </div>

            {emailProvider === 'imap' && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imap-host">IMAP server</Label>
                    <Input
                      id="imap-host"
                      placeholder="imap.seznam.cz"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imap-port">Port</Label>
                    <Input
                      id="imap-port"
                      value="993"
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="imap-email">Emailová adresa</Label>
                  <Input
                    id="imap-email"
                    type="email"
                    placeholder="vas@email.cz"
                    value={imapEmail}
                    onChange={(e) => setImapEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="imap-pass">Heslo aplikace</Label>
                  <Input
                    id="imap-pass"
                    type="password"
                    placeholder="Heslo aplikace (ne přihlašovací heslo)"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Doporučujeme vygenerovat speciální heslo aplikace v nastavení emailu.
                  </p>
                </div>
              </div>
            )}

            <Button onClick={handleStep1} disabled={!emailProvider || loading} className="w-full">
              {loading ? 'Připojuji...' : 'Pokračovat'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2: Accounting */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Připoj fakturační systém</h2>
              <p className="text-sm text-gray-500">Kam budeme posílat zpracované faktury?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ProviderButton
                active={accountingProvider === 'idoklad'}
                onClick={() => setAccountingProvider('idoklad')}
                color="blue"
                emoji="🧾"
                label="iDoklad"
                description="REST API v3"
              />
              <ProviderButton
                active={accountingProvider === 'fakturoid'}
                onClick={() => setAccountingProvider('fakturoid')}
                color="indigo"
                emoji="📊"
                label="Fakturoid"
                description="API v3"
              />
            </div>

            {accountingProvider && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                {accountingProvider === 'fakturoid' && (
                  <div>
                    <Label htmlFor="acc-slug">Slug účtu (z URL Fakturoid)</Label>
                    <Input
                      id="acc-slug"
                      placeholder="nazev-firmy"
                      value={accountSlug}
                      onChange={(e) => setAccountSlug(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Najdete v URL: app.fakturoid.cz/api/v3/accounts/<strong>slug</strong>/...
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="api-key">
                    {accountingProvider === 'idoklad' ? 'API klíč (Bearer token)' : 'OAuth token'}
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={
                      accountingProvider === 'idoklad'
                        ? 'Najdete v iDoklad > Nastavení > API'
                        : 'Najdete v Fakturoid > Nastavení > API'
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Zpět
              </Button>
              <Button
                onClick={handleStep2}
                disabled={!accountingProvider || !apiKey || loading}
                className="flex-1"
              >
                {loading ? 'Ověřuji...' : 'Pokračovat'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Pravidla zpracování</h2>
              <p className="text-sm text-gray-500">Toto můžete kdykoli změnit v nastavení.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Emailové notifikace</p>
                  <p className="text-xs text-gray-500 mt-0.5">Upozornit při každé nové faktuře</p>
                </div>
                <button
                  onClick={() => setNotifyOnNew(!notifyOnNew)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    notifyOnNew ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      notifyOnNew ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Automatické schválení</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Faktury pod touto částkou pošleme automaticky (volitelné)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Např. 5000"
                    value={autoApproveBelow}
                    onChange={(e) => setAutoApproveBelow(e.target.value)}
                    className="w-40"
                  />
                  <span className="text-sm text-gray-500">Kč</span>
                  {autoApproveBelow && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Aktívní
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Zpět
              </Button>
              <Button onClick={handleStep3} disabled={loading} className="flex-1">
                {loading ? 'Ukládám...' : 'Dokončit nastavení'}
                <CheckCircle2 className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

interface ProviderButtonProps {
  active: boolean
  onClick: () => void
  color: string
  emoji: string
  label: string
  description: string
}

function ProviderButton({ active, onClick, emoji, label, description }: ProviderButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-blue-300',
        active
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 bg-white hover:bg-gray-50'
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <p
          className={cn(
            'text-sm font-semibold',
            active ? 'text-blue-700' : 'text-gray-900'
          )}
        >
          {label}
        </p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      {active && (
        <CheckCircle2 className="h-5 w-5 text-blue-600 ml-auto shrink-0" />
      )}
    </button>
  )
}
