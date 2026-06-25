import { Client } from '@microsoft/microsoft-graph-client'

export function getMicrosoftAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    response_mode: 'query',
    scope: 'openid email Mail.Read offline_access',
    prompt: 'consent',
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
}

export interface OutlookTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  email: string
}

export async function exchangeOutlookCode(code: string): Promise<OutlookTokens> {
  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code,
        scope: 'openid email Mail.Read offline_access',
      }),
    }
  )
  const tokens = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const me = (await meRes.json()) as { mail?: string; userPrincipalName?: string }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    email: me.mail ?? me.userPrincipalName ?? '',
  }
}

export async function refreshOutlookToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'openid email Mail.Read offline_access',
      }),
    }
  )
  return res.json()
}

export interface EmailWithPdf {
  messageId: string
  subject: string
  senderEmail: string
  receivedAt: Date
  pdfBase64: string
  pdfFilename: string
}

export async function fetchOutlookEmailsWithPdf(
  accessToken: string,
  lastCheckedAt?: Date
): Promise<EmailWithPdf[]> {
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  })

  const since = lastCheckedAt?.toISOString() ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const messages = await client
    .api('/me/messages')
    .filter(`hasAttachments eq true and receivedDateTime ge ${since}`)
    .select('id,subject,from,receivedDateTime')
    .top(50)
    .get()

  const results: EmailWithPdf[] = []

  for (const msg of (messages.value ?? []) as Array<{
    id: string
    subject: string
    from: { emailAddress: { address: string } }
    receivedDateTime: string
  }>) {
    const attachments = await client
      .api(`/me/messages/${msg.id}/attachments`)
      .filter("contentType eq 'application/pdf'")
      .get()

    const pdfAttachment = (attachments.value ?? []).find(
      (a: { name?: string; contentBytes?: string }) =>
        a.name?.toLowerCase().endsWith('.pdf') && a.contentBytes
    ) as { name: string; contentBytes: string } | undefined

    if (!pdfAttachment) continue

    results.push({
      messageId: msg.id,
      subject: msg.subject ?? '',
      senderEmail: msg.from.emailAddress.address,
      receivedAt: new Date(msg.receivedDateTime),
      pdfBase64: pdfAttachment.contentBytes,
      pdfFilename: pdfAttachment.name,
    })
  }

  return results
}
