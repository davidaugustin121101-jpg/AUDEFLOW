import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  let dbQuery = supabase
    .from('products')
    .select('id, code, name, unit, price, currency, stock_qty')
    .eq('company_id', profile.company_id)
    .limit(limit)

  if (query) {
    dbQuery = dbQuery.textSearch('search_vector', query.split(' ').join(' & '), {
      type: 'plain',
      config: 'simple',
    })
  }

  const { data, error } = await dbQuery

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}
