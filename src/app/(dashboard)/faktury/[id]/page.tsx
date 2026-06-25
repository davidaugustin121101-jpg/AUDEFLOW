import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProcessedInvoice } from '@/types/invoices'
import { FieldRow, ConfidenceBadge } from '@/components/invoices/ConfidenceBadge'
import { AccountingCodeBadge } from '@/components/invoices/AccountingCodeBadge'
import { InvoiceActions } from './InvoiceActions'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) notFound()

  const inv = invoice as ProcessedInvoice
  const problemy = inv.problemy ?? []
  const canAct = inv.status === 'pending_review' || inv.status === 'needs_manual_check'

  const { data: accountingConn } = await supabase
    .from('accounting_connections')
    .select('id, provider, account_slug')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  const formatDate = (d: string | null) =>
    d ? new Intl.DateTimeFormat('cs-CZ').format(new Date(d)) : null
  const formatMoney = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: inv.mena ?? 'CZK',
        }).format(n)
      : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/faktury"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zpět na faktury
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {inv.dodavatel_nazev ?? 'Neznámý dodavatel'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {inv.sender_email && `Od: ${inv.sender_email}`}
                {inv.received_at && (
                  <> · Přijato {formatDate(inv.received_at)}</>
                )}
              </p>
            </div>
            <ConfidenceBadge value={inv.confidence} />
          </div>
        </div>

        {/* Warning about low-confidence fields */}
        {problemy.length > 0 && (
          <div className="mx-6 my-4 flex items-start gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Nízká jistota u polí:</p>
              <p className="text-sm text-yellow-700">{problemy.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Extracted fields */}
        <div className="px-6 py-2">
          <FieldRow
            label="Dodavatel"
            value={inv.dodavatel_nazev}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_nazev')}
          />
          <FieldRow
            label="IČO"
            value={inv.dodavatel_ico}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_ico')}
          />
          <FieldRow
            label="DIČ"
            value={inv.dodavatel_dic}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('dodavatel_dic')}
          />
          <FieldRow
            label="Číslo faktury"
            value={inv.cislo_faktury}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('cislo_faktury')}
          />
          <FieldRow
            label="Datum vystavení"
            value={formatDate(inv.datum_vystaveni)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('datum_vystaveni')}
          />
          <FieldRow
            label="Datum splatnosti"
            value={formatDate(inv.datum_splatnosti)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('datum_splatnosti')}
          />
          <FieldRow
            label="Variabilní symbol"
            value={inv.variabilni_symbol}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('variabilni_symbol')}
          />
          <FieldRow
            label="Základ DPH"
            value={formatMoney(inv.castka_bez_dph)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_bez_dph')}
          />
          <FieldRow
            label={`DPH ${inv.sazba_dph ?? 0}%`}
            value={formatMoney(inv.castka_dph)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_dph')}
          />
          <FieldRow
            label="CELKEM"
            value={formatMoney(inv.castka_celkem)}
            globalConfidence={inv.confidence}
            inProblemy={problemy.includes('castka_celkem')}
          />
          {inv.iban && (
            <FieldRow
              label="IBAN"
              value={inv.iban}
              globalConfidence={inv.confidence}
              inProblemy={problemy.includes('iban')}
            />
          )}
          {inv.popis_plneni && (
            <FieldRow
              label="Popis plnění"
              value={inv.popis_plneni}
              globalConfidence={inv.confidence}
              inProblemy={problemy.includes('popis_plneni')}
            />
          )}
        </div>

        {/* Accounting code section */}
        {inv.ucetni_kod && (
          <div className="px-6 py-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Navržený účetní kód
            </p>
            <AccountingCodeBadge
              kod={inv.ucetni_kod}
              nazev={inv.ucetni_kod_nazev ?? ''}
              duvod={inv.ucetni_kod_duvod ?? ''}
              confidence={inv.ucetni_kod_confidence ?? 0}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {canAct && accountingConn && (
        <InvoiceActions
          invoiceId={inv.id}
          accountingProvider={accountingConn.provider}
        />
      )}

      {/* Already processed */}
      {!canAct && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-center">
          {inv.status === 'sent_to_accounting' && (
            <p className="text-sm text-gray-600">
              ✅ Faktura byla odeslána do{' '}
              <strong>{inv.accounting_provider}</strong>
              {inv.accounting_document_id && (
                <> · Doklad č. {inv.accounting_document_id}</>
              )}
            </p>
          )}
          {inv.status === 'rejected' && (
            <p className="text-sm text-gray-600">❌ Faktura byla zamítnuta</p>
          )}
          {inv.status === 'error' && (
            <p className="text-sm text-red-600">
              Nastala chyba při odesílání. Zkuste to znovu v nastavení.
            </p>
          )}
        </div>
      )}

      {canAct && !accountingConn && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5 text-center">
          <p className="text-sm text-yellow-800">
            Nejprve připojte fakturační systém v{' '}
            <Link href="/settings/accounting" className="underline font-medium">
              nastavení
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
