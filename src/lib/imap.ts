import { ImapFlow } from 'imapflow'

export interface ImapConfig {
  host: string
  port: number
  email: string
  password: string
}

export interface EmailWithPdf {
  messageId: string
  subject: string
  senderEmail: string
  receivedAt: Date
  pdfBase64: string
  pdfFilename: string
}

export async function testImapConnection(config: ImapConfig): Promise<boolean> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.email, pass: config.password },
    logger: false,
  })
  try {
    await client.connect()
    await client.logout()
    return true
  } catch {
    return false
  }
}

export async function fetchImapEmailsWithPdf(
  config: ImapConfig,
  lastCheckedAt?: Date
): Promise<EmailWithPdf[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.email, pass: config.password },
    logger: false,
  })

  await client.connect()
  const results: EmailWithPdf[] = []

  try {
    await client.mailboxOpen('INBOX')

    const since = lastCheckedAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000)
    const searchCriteria = { since, seen: false }

    for await (const msg of client.fetch(searchCriteria, {
      envelope: true,
      source: true,
    })) {
      const source = msg.source?.toString() ?? ''
      if (!source) continue

      const pdfs = extractPdfsFromMime(source)
      for (const pdf of pdfs) {
        results.push({
          messageId: String(msg.uid),
          subject: msg.envelope?.subject ?? '',
          senderEmail: msg.envelope?.from?.[0]?.address ?? '',
          receivedAt: msg.envelope?.date ?? new Date(),
          pdfBase64: pdf.base64,
          pdfFilename: pdf.filename,
        })
      }
    }
  } finally {
    await client.logout()
  }

  return results
}

function extractPdfsFromMime(
  source: string
): Array<{ base64: string; filename: string }> {
  const results: Array<{ base64: string; filename: string }> = []
  const boundary = source.match(/boundary="?([^"\r\n;]+)"?/i)?.[1]
  if (!boundary) return results

  const parts = source.split(`--${boundary}`)
  for (const part of parts) {
    const isPdf =
      /content-type:\s*application\/pdf/i.test(part) ||
      /filename="?[^"]*\.pdf"?/i.test(part)
    if (!isPdf) continue

    const filename = part.match(/filename="?([^"\r\n]+\.pdf)"?/i)?.[1] ?? 'faktura.pdf'
    const encodingHeader = part.match(/content-transfer-encoding:\s*(\S+)/i)?.[1]

    const bodyStart = part.indexOf('\r\n\r\n')
    if (bodyStart === -1) continue

    const rawBody = part.slice(bodyStart + 4).replace(/\r\n/g, '')
    const base64 =
      encodingHeader?.toLowerCase() === 'base64'
        ? rawBody.trim()
        : Buffer.from(rawBody).toString('base64')

    results.push({ base64, filename })
  }

  return results
}
