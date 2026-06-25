'use client'

import { useState } from 'react'
import { Mail, Trash2, Plus, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EmailConnection } from '@/types/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const PROVIDER_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  imap: 'IMAP',
}

interface Props {
  connections: EmailConnection[]
}

export function EmailConnectionManager({ connections }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch(`/api/email-connections/${id}`, { method: 'DELETE' })
    setDeleting(null)
    toast.success('Připojení odstraněno')
    router.refresh()
  }

  async function handleGmail() {
    const res = await fetch('/api/gmail/auth-url')
    const { url } = await res.json()
    window.location.href = url
  }

  async function handleOutlook() {
    const res = await fetch('/api/outlook/auth-url')
    const { url } = await res.json()
    window.location.href = url
  }

  const isExpired = (conn: EmailConnection) =>
    conn.token_expiry ? new Date(conn.token_expiry) < new Date() : false

  return (
    <div className="space-y-4">
      {connections.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <Mail className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Žádná emailová připojení</p>
          <p className="text-xs text-gray-400 mt-1">Přidejte email pro automatické zpracování faktur</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => {
            const expired = isExpired(conn)
            return (
              <div
                key={conn.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200"
              >
                <div
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold',
                    conn.provider === 'gmail'
                      ? 'bg-red-50 text-red-600'
                      : conn.provider === 'outlook'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {conn.provider === 'gmail' ? 'G' : conn.provider === 'outlook' ? 'O' : '✉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conn.email_address}
                    </p>
                    {conn.is_active && !expired ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PROVIDER_LABELS[conn.provider]}
                    {conn.last_checked_at && (
                      <>
                        {' '}
                        · Naposledy zkontrolováno{' '}
                        {new Intl.DateTimeFormat('cs-CZ', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(conn.last_checked_at))}
                      </>
                    )}
                  </p>
                </div>
                {expired && (
                  <Badge variant="destructive" className="text-xs">
                    Token expiroval
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  {(conn.provider === 'gmail' || conn.provider === 'outlook') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600"
                      title="Obnovit token"
                      onClick={
                        conn.provider === 'gmail' ? handleGmail : handleOutlook
                      }
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
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
              </div>
            )
          })}
        </div>
      )}

      {/* Add new */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Přidat email</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleGmail} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Gmail
          </Button>
          <Button variant="outline" size="sm" onClick={handleOutlook} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Outlook
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => toast.info('IMAP nastavení naleznete v průvodci onboardingem')}
          >
            <Plus className="h-3.5 w-3.5" />
            IMAP
          </Button>
        </div>
      </div>
    </div>
  )
}
