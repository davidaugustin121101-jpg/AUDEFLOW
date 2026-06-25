import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testImapConnection } from '@/lib/imap'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { host, email, password, port = 993 } = await req.json()

  const ok = await testImapConnection({ host, port, email, password })
  if (!ok) {
    return NextResponse.json({ error: 'Nepodařilo se připojit k IMAP serveru' }, { status: 400 })
  }

  const { data: passwordSecret } = await supabase.rpc('vault.create_secret', {
    secret: password,
    name: `imap_pass_${user.id}_${email}`,
  }).single()

  const { data: existing } = await supabase
    .from('email_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('email_address', email)
    .maybeSingle()

  const connectionData = {
    user_id: user.id,
    provider: 'imap' as const,
    email_address: email,
    imap_host: host,
    imap_port: port,
    imap_password_secret_id:
      (passwordSecret as { id: string } | null)?.id ?? password,
    is_active: true,
  }

  if (existing) {
    await supabase.from('email_connections').update(connectionData).eq('id', existing.id)
  } else {
    await supabase.from('email_connections').insert(connectionData)
  }

  return NextResponse.json({ ok: true })
}
