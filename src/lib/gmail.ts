import { google } from 'googleapis'

// Use the OAuth2Client from googleapis (avoids google-auth-library version conflicts)
type GoogleOAuth2Client = InstanceType<typeof google.auth.OAuth2>

export function createOAuth2Client(): GoogleOAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  )
}

export function getGmailAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  })
}

export interface GmailTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
  email: string
}

export async function exchangeCodeForTokens(code: string): Promise<GmailTokens> {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)

  // Fetch user email via userinfo endpoint
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const userInfo = (await res.json()) as { email: string }

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    email: userInfo.email,
  }
}

export interface EmailWithPdf {
  messageId: string
  subject: string
  senderEmail: string
  receivedAt: Date
  pdfBase64: string
  pdfFilename: string
}

export async function fetchNewEmailsWithPdf(
  accessToken: string,
  refreshToken: string,
  expiryDate: number,
  lastCheckedAt?: Date
): Promise<EmailWithPdf[]> {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiryDate,
  })

  // Auto-refresh token if expired
  if (Date.now() >= expiryDate - 60_000) {
    await oauth2Client.refreshAccessToken()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client as any })

  const sinceDate = lastCheckedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000)
  const afterUnix = Math.floor(sinceDate.getTime() / 1000)

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: `has:attachment filename:pdf after:${afterUnix}`,
    maxResults: 50,
  })

  const messages = listRes.data.messages ?? []
  const results: EmailWithPdf[] = []

  for (const msg of messages) {
    if (!msg.id) continue
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    })

    const headers = full.data.payload?.headers ?? []
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? ''
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? ''
    const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value

    const senderEmail = from.match(/<(.+?)>/)?.[1] ?? from
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date()

    const pdfPart = findPdfPart(full.data.payload)
    if (!pdfPart || !pdfPart.body?.attachmentId) continue

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: msg.id,
      id: pdfPart.body.attachmentId,
    })

    const pdfBase64 = attachment.data.data
      ? attachment.data.data.replace(/-/g, '+').replace(/_/g, '/')
      : ''

    if (!pdfBase64) continue

    results.push({
      messageId: msg.id,
      subject,
      senderEmail,
      receivedAt,
      pdfBase64,
      pdfFilename: pdfPart.filename ?? 'faktura.pdf',
    })
  }

  return results
}

function findPdfPart(
  payload: import('googleapis').gmail_v1.Schema$MessagePart | undefined
): import('googleapis').gmail_v1.Schema$MessagePart | null {
  if (!payload) return null
  if (
    payload.mimeType === 'application/pdf' ||
    payload.filename?.toLowerCase().endsWith('.pdf')
  ) {
    return payload
  }
  for (const part of payload.parts ?? []) {
    const found = findPdfPart(part)
    if (found) return found
  }
  return null
}
