import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendToIdoklad, type IdokladConnection } from '@/lib/idoklad'
import { sendToFakturoid } from '@/lib/fakturoid'
import type { ExtractedInvoiceData } from '@/lib/claude'
import type { ProcessedInvoice } from '@/types/invoices'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Chybí invoiceId' }, { status: 400 })

  const { data: invoice } = await supabase
    .from('processed_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Faktura nenalezena' }, { status: 404 })

  const inv = invoice as ProcessedInvoice

  if (inv.status !== 'pending_review' && inv.status !== 'needs_manual_check') {
    return NextResponse.json({ error: 'Faktura již byla zpracována' }, { status: 400 })
  }

  const { data: accounting } = await supabase
    .from('accounting_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!accounting) {
    return NextResponse.json({ error: 'Žádný fakturační systém není připojen' }, { status: 400 })
  }

  // Decrypt the stored secret (Vault or plain fallback)
  async function decryptSecret(secretId: string | null): Promise<string | null> {
    if (!secretId) return null
    try {
      const { data } = await supabase.rpc('vault.decrypted_secret', { secret_id: secretId })
      return (data as string | null) ?? secretId
    } catch {
      return secretId
    }
  }

  const apiKey = await decryptSecret(accounting.api_key_secret_id)
  const clientSecret = await decryptSecret(
    (accounting as Record<string, unknown>).client_secret_id as string | null
  )

  const extractedData: ExtractedInvoiceData = {
    dodavatel_nazev: inv.dodavatel_nazev ?? '',
    dodavatel_ico: inv.dodavatel_ico ?? '',
    dodavatel_dic: inv.dodavatel_dic,
    cislo_faktury: inv.cislo_faktury ?? '',
    datum_vystaveni: inv.datum_vystaveni ?? new Date().toISOString().slice(0, 10),
    datum_splatnosti: inv.datum_splatnosti ?? new Date().toISOString().slice(0, 10),
    variabilni_symbol: inv.variabilni_symbol ?? '',
    castka_bez_dph: inv.castka_bez_dph ?? 0,
    sazba_dph: inv.sazba_dph ?? 21,
    castka_dph: inv.castka_dph ?? 0,
    castka_celkem: inv.castka_celkem ?? 0,
    mena: inv.mena ?? 'CZK',
    popis_plneni: inv.popis_plneni ?? '',
    iban: inv.iban,
    ucetni_kod: inv.ucetni_kod ?? '518',
    ucetni_kod_nazev: inv.ucetni_kod_nazev ?? 'Ostatní služby',
    ucetni_kod_duvod: inv.ucetni_kod_duvod ?? '',
    ucetni_kod_confidence: inv.ucetni_kod_confidence ?? 0,
    confidence: inv.confidence ?? 0,
    problemy: inv.problemy ?? [],
  }

  try {
    let result: { id: string; documentNumber?: string; number?: string }

    if (accounting.provider === 'idoklad') {
      const conn: IdokladConnection = {
        provider: 'idoklad',
        client_id: (accounting as Record<string, unknown>).client_id as string | null,
        client_secret: clientSecret ?? apiKey ?? '',
      }
      const r = await sendToIdoklad(conn, extractedData)
      result = { id: r.id, documentNumber: r.documentNumber }
    } else {
      const r = await sendToFakturoid(apiKey ?? '', accounting.account_slug ?? '', extractedData)
      result = { id: r.id, number: r.number }
    }

    await supabase
      .from('processed_invoices')
      .update({
        status: 'sent_to_accounting',
        accounting_provider: accounting.provider,
        accounting_document_id: result.documentNumber ?? result.number ?? result.id,
        accounting_connection_id: accounting.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    await supabase.from('invoice_audit_log').insert({
      invoice_id: invoiceId,
      user_id: user.id,
      action: 'sent',
      details: {
        provider: accounting.provider,
        document_id: result.id,
        ucetni_kod: extractedData.ucetni_kod,
      },
    })

    return NextResponse.json({ ok: true, documentId: result.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznámá chyba'

    await supabase.from('processed_invoices').update({ status: 'error' }).eq('id', invoiceId)
    await supabase.from('invoice_audit_log').insert({
      invoice_id: invoiceId,
      user_id: user.id,
      action: 'error',
      details: { error: message },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
