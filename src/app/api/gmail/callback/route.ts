import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/gmail'

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
    const tokens = await exchangeCodeForTokens(code)

    // Check for existing connection with same email
    const { data: existing } = await supabase
      .from('email_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_address', tokens.email)
      .maybeSingle()

    // Store tokens as Vault secrets
    const { data: accessSecret } = await supabase.rpc('vault.create_secret', {
      secret: tokens.access_token,
      name: `gmail_access_${user.id}_${Date.now()}`,
    }).single()

    const { data: refreshSecret } = await supabase.rpc('vault.create_secret', {
      secret: tokens.refresh_token,
      name: `gmail_refresh_${user.id}_${tokens.email}`,
    }).single()

    const connectionData = {
      user_id: user.id,
      provider: 'gmail' as const,
      email_address: tokens.email,
      access_token_secret_id: (accessSecret as { id: string } | null)?.id ?? tokens.access_token,
      refresh_token_secret_id: (refreshSecret as { id: string } | null)?.id ?? tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      is_active: true,
    }

    if (existing) {
      await supabase
        .from('email_connections')
        .update(connectionData)
        .eq('id', existing.id)
    } else {
      await supabase.from('email_connections').insert(connectionData)
    }

    return NextResponse.redirect(new URL('/settings/email?success=gmail_connected', req.url))
  } catch (err) {
    console.error('Gmail OAuth error:', err)
    return NextResponse.redirect(new URL('/settings/email?error=oauth_failed', req.url))
  }
}
