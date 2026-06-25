import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractInvoiceFromPdf } from '@/lib/claude'
import { fetchNewEmailsWithPdf } from '@/lib/gmail'
import { fetchOutlookEmailsWithPdf, refreshOutlookToken } from '@/lib/outlook'
import { fetchImapEmailsWithPdf } from '@/lib/imap'

// Vercel Cron: runs every 15 minutes via vercel.json config
// Protected by CRON_SECRET env variable
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: connections } = await supabase
    .from('email_connections')
    .select('*')
    .eq('is_active', true)

  if (!connections || connections.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let totalProcessed = 0

  for (const conn of connections) {
    try {
      const emails = await fetchEmailsForConnection(supabase, conn)

      for (const email of emails) {
        try {
          const extracted = await extractInvoiceFromPdf(email.pdfBase64)

          // Determine status based on confidence
          const status =
            extracted.confidence >= 0.85 ? 'pending_review' : 'needs_manual_check'

          // Check for duplicate invoice
          const { data: duplicate } = await supabase
            .from('processed_invoices')
            .select('id')
            .eq('user_id', conn.user_id)
            .eq('dodavatel_ico', extracted.dodavatel_ico)
            .eq('cislo_faktury', extracted.cislo_faktury)
            .neq('status', 'rejected')
            .maybeSingle()

          if (duplicate) {
            continue // Skip duplicate
          }

          // Check auto-approve setting
          const { data: settings } = await supabase
            .from('invoice_settings')
            .select('auto_approve_below, notify_on_new')
            .eq('user_id', conn.user_id)
            .maybeSingle()

          const autoApprove =
            settings?.auto_approve_below != null &&
            extracted.castka_celkem <= settings.auto_approve_below &&
            extracted.confidence >= 0.9

          const { data: newInvoice } = await supabase
            .from('processed_invoices')
            .insert({
              user_id: conn.user_id,
              email_connection_id: conn.id,
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
              mena: extracted.mena,
              popis_plneni: extracted.popis_plneni,
              iban: extracted.iban,
              confidence: extracted.confidence,
              problemy: extracted.problemy,
              raw_extraction: extracted as unknown as Record<string, unknown>,
              status: autoApprove ? 'approved' : status,
              original_email_id: email.messageId,
              sender_email: email.senderEmail,
              received_at: email.receivedAt.toISOString(),
            })
            .select('id')
            .single()

          if (newInvoice) {
            await supabase.from('invoice_audit_log').insert({
              invoice_id: newInvoice.id,
              user_id: conn.user_id,
              action: autoApprove ? 'auto_approved' : 'extracted',
              details: {
                confidence: extracted.confidence,
                sender: email.senderEmail,
                subject: email.subject,
              },
            })

            // If auto-approve, immediately send to accounting
            if (autoApprove) {
              await autoSendToAccounting(supabase, conn.user_id, newInvoice.id, extracted)
            }
          }

          totalProcessed++
        } catch (emailErr) {
          console.error(`Error processing email ${email.messageId}:`, emailErr)
        }
      }

      // Update last checked timestamp
      await supabase
        .from('email_connections')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', conn.id)
    } catch (connErr) {
      console.error(`Error fetching emails for connection ${conn.id}:`, connErr)
      // Mark connection as needing attention if token refresh failed
    }
  }

  return NextResponse.json({ processed: totalProcessed })
}

async function fetchEmailsForConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  conn: {
    id: string
    user_id: string
    provider: string
    access_token_secret_id: string
    refresh_token_secret_id: string
    imap_password_secret_id: string
    imap_host: string
    imap_port: number
    email_address: string
    token_expiry: string | null
    last_checked_at: string | null
  }
) {
  const lastChecked = conn.last_checked_at ? new Date(conn.last_checked_at) : undefined

  const decryptSecret = async (secretId: string): Promise<string> => {
    try {
      const { data } = await supabase.rpc('vault.decrypted_secret', { secret_id: secretId })
      return (data as string | null) ?? secretId
    } catch {
      return secretId
    }
  }

  if (conn.provider === 'gmail') {
    const [accessToken, refreshToken] = await Promise.all([
      decryptSecret(conn.access_token_secret_id),
      decryptSecret(conn.refresh_token_secret_id),
    ])
    const expiryDate = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0

    const emails = await fetchNewEmailsWithPdf(
      accessToken,
      refreshToken,
      expiryDate,
      lastChecked
    )
    return emails
  }

  if (conn.provider === 'outlook') {
    const [accessToken, refreshToken] = await Promise.all([
      decryptSecret(conn.access_token_secret_id),
      decryptSecret(conn.refresh_token_secret_id),
    ])
    const expiryDate = conn.token_expiry ? new Date(conn.token_expiry) : new Date()

    let token = accessToken
    if (expiryDate <= new Date()) {
      const refreshed = await refreshOutlookToken(refreshToken)
      token = refreshed.access_token
      await supabase.from('email_connections').update({
        token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      }).eq('id', conn.id)
    }

    return fetchOutlookEmailsWithPdf(token, lastChecked)
  }

  if (conn.provider === 'imap') {
    const password = await decryptSecret(conn.imap_password_secret_id)
    return fetchImapEmailsWithPdf(
      {
        host: conn.imap_host,
        port: conn.imap_port ?? 993,
        email: conn.email_address,
        password,
      },
      lastChecked
    )
  }

  return []
}

async function autoSendToAccounting(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  invoiceId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _extracted: import('@/lib/claude').ExtractedInvoiceData
) {
  // Trigger the approve API internally
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    await fetch(`${baseUrl}/api/invoices/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Service role key for internal calls
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ invoiceId, userId }),
    })
  } catch (err) {
    console.error('Auto-approve failed:', err)
    await supabase
      .from('processed_invoices')
      .update({ status: 'pending_review' })
      .eq('id', invoiceId)
  }
}
