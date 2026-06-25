import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeOutlookCode } from '@/lib/outlook'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/settings/email?error=oauth_denied', req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const tokens = await exchangeOutlookCode(code)

    const { data: existing } = await supabase
      .from('email_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_address', tokens.email)
      .maybeSingle()

    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { data: accessSecret } = await supabase.rpc('vault.create_secret', {
      secret: tokens.access_token,
      name: `outlook_access_${user.id}_${Date.now()}`,
    }).single()

    const { data: refreshSecret } = await supabase.rpc('vault.create_secret', {
      secret: tokens.refresh_token,
      name: `outlook_refresh_${user.id}_${tokens.email}`,
    }).single()

    const connectionData = {
      user_id: user.id,
      provider: 'outlook' as const,
      email_address: tokens.email,
      access_token_secret_id: (accessSecret as { id: string } | null)?.id ?? tokens.access_token,
      refresh_token_secret_id: (refreshSecret as { id: string } | null)?.id ?? tokens.refresh_token,
      token_expiry: expiryDate,
      is_active: true,
    }

    if (existing) {
      await supabase.from('email_connections').update(connectionData).eq('id', existing.id)
    } else {
      await supabase.from('email_connections').insert(connectionData)
    }

    return NextResponse.redirect(new URL('/settings/email?success=outlook_connected', req.url))
  } catch (err) {
    console.error('Outlook OAuth error:', err)
    return NextResponse.redirect(new URL('/settings/email?error=oauth_failed', req.url))
  }
}
