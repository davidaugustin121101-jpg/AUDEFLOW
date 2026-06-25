import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractInvoiceFromPdf } from '@/lib/claude'

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  starter: 100,
  pro: 999_999,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nepřihlášen' }, { status: 401 })

  // Check monthly plan limit
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count } = await supabase
    .from('processed_invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', firstOfMonth)

  // Fetch plan from user_profiles (if it exists) or default to 'free'
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  const plan = (profile as { plan?: string } | null)?.plan ?? 'free'
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  if ((count ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Dosáhl jsi limitu ${limit} faktur pro tento měsíc. Upgraduj plán.` },
      { status: 429 }
    )
  }

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Chybí soubor' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Nahraj prosím PDF soubor' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Soubor je příliš velký (max 10 MB)' }, { status: 400 })
  }

  // PDF → base64 (kept only in memory, never persisted)
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  let extracted
  try {
    extracted = await extractInvoiceFromPdf(base64)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Chyba při zpracování AI'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Save structured data only (no PDF)
  const { data: invoice, error: dbErr } = await supabase
    .from('processed_invoices')
    .insert({
      user_id: user.id,
      dodavatel_nazev: extracted.dodavatel_nazev,
      dodavatel_ico: extracted.dodavatel_ico,
      dodavatel_dic: extracted.dodavatel_dic,
      cislo_faktury: extracted.cislo_faktury,
      datum_vystaveni: extracted.datum_vystaveni,
      datum_splatnosti: extracted.datum_splatnosti,
      variabilni_symbol: extracted.variabilni_symbol,
      castka_bez_dph: extracted.castka_bez_dph,
      sazba_dph: extracted.sazba_dph,
      castka_dph: extracted.castka_dph,
      castka_celkem: extracted.castka_celkem,
      mena: extracted.mena ?? 'CZK',
      popis_plneni: extracted.popis_plneni,
      iban: extracted.iban,
      ucetni_kod: extracted.ucetni_kod,
      ucetni_kod_nazev: extracted.ucetni_kod_nazev,
      ucetni_kod_duvod: extracted.ucetni_kod_duvod,
      ucetni_kod_confidence: extracted.ucetni_kod_confidence,
      confidence: extracted.confidence,
      problemy: extracted.problemy ?? [],
      raw_extraction: extracted as unknown as Record<string, unknown>,
      original_filename: file.name,
      status: 'pending_review',
    })
    .select()
    .single()

  if (dbErr || !invoice) {
    return NextResponse.json({ error: 'Chyba při ukládání do databáze' }, { status: 500 })
  }

  // Audit log
  await supabase.from('invoice_audit_log').insert({
    invoice_id: invoice.id,
    user_id: user.id,
    action: 'extracted',
    details: {
      confidence: extracted.confidence,
      ucetni_kod: extracted.ucetni_kod,
      filename: file.name,
      source: 'manual_upload',
    },
  })

  return NextResponse.json({ invoice })
}
