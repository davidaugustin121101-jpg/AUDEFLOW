import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateIdokladConnection } from '@/lib/idoklad'
import { validateFakturoidToken } from '@/lib/fakturoid'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { provider, apiKey, accountSlug, clientId, clientSecret } = body as {
    provider: string
    apiKey?: string
    accountSlug?: string
    clientId?: string
    clientSecret?: string
  }

  if (!provider) {
    return NextResponse.json({ error: 'Chybí provider' }, { status: 400 })
  }

  let valid = false
  try {
    if (provider === 'idoklad') {
      // Support both: OAuth2 (clientId + clientSecret) and legacy Bearer token (apiKey)
      const id = clientId ?? null
      const secret = clientSecret ?? apiKey ?? ''
      if (!secret) {
        return NextResponse.json({ error: 'Chybí Client Secret nebo API klíč' }, { status: 400 })
      }
      valid = await validateIdokladConnection(id, secret)
    } else if (provider === 'fakturoid') {
      if (!accountSlug || !apiKey) {
        return NextResponse.json({ error: 'Chybí slug účtu nebo OAuth token' }, { status: 400 })
      }
      valid = await validateFakturoidToken(apiKey, accountSlug)
    }
  } catch {
    return NextResponse.json({ error: 'Nepodařilo se ověřit přihlašovací údaje' }, { status: 400 })
  }

  if (!valid) {
    return NextResponse.json({ error: 'Neplatné přihlašovací údaje' }, { status: 400 })
  }

  // Store secrets in Vault
  async function storeSecret(value: string, label: string): Promise<string> {
    try {
      const { data } = await supabase
        .rpc('vault.create_secret', {
          secret: value,
          name: `${label}_${user!.id}_${Date.now()}`,
        })
        .single()
      return (data as { id: string } | null)?.id ?? value
    } catch {
      return value
    }
  }

  const connData: Record<string, unknown> = {
    user_id: user.id,
    provider,
    is_active: true,
    account_slug: accountSlug ?? null,
  }

  if (provider === 'idoklad') {
    const secret = clientSecret ?? apiKey ?? ''
    connData.client_id = clientId ?? null
    connData.client_secret_id = await storeSecret(secret, `idoklad_secret`)
    connData.api_key_secret_id = null
  } else {
    connData.api_key_secret_id = await storeSecret(apiKey!, `${provider}_token`)
    connData.client_id = null
    connData.client_secret_id = null
  }

  const { data: existing } = await supabase
    .from('accounting_connections')
    .select('id')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle()

  if (existing) {
    await supabase.from('accounting_connections').update(connData).eq('id', existing.id)
  } else {
    await supabase.from('accounting_connections').insert(connData)
  }

  return NextResponse.json({ ok: true })
}
