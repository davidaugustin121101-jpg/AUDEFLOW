import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AIQuoteResponse, ParsedQuoteItem } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { emailSubject, emailBody } = body as { emailSubject: string; emailBody: string }

  if (!emailBody?.trim()) {
    return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
  }

  // Get company context
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  // Fetch products (up to 3000 for context window)
  const { data: products } = await supabase
    .from('products')
    .select('code, name, unit, price, currency')
    .eq('company_id', profile.company_id)
    .limit(3000)

  // Fetch active rules
  const { data: rules } = await supabase
    .from('company_rules')
    .select('title, content')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)

  // Build product list for prompt (compact CSV-like)
  const productList = (products ?? [])
    .map((p) => `${p.code}|${p.name}|${p.price ?? '?'}|${p.currency}|${p.unit ?? ''}`)
    .join('\n')

  const rulesText = (rules ?? [])
    .map((r) => `[${r.title}]: ${r.content}`)
    .join('\n')

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const systemPrompt = `Jsi AI asistent obchodníka v B2B firmě. Analyzuješ poptávkový e-mail a navrhneš nabídku na základě interního ceníku.

CENÍK FIRMY (formát: KÓD|NÁZEV|CENA|MĚNA|JEDNOTKA):
${productList || 'Žádné produkty v databázi.'}

${rulesText ? `INTERNÍ PRAVIDLA:\n${rulesText}` : ''}

INSTRUKCE:
1. Přečti text e-mailu a identifikuj poptávané položky (produkty, množství, jednotky).
2. Pro každou položku najdi nejlepší shodu v ceníku (porovnej název, kód, popis).
3. Vrať VÝHRADNĚ validní JSON (bez markdown bloků, bez komentářů) v tomto formátu:
{
  "items": [
    {
      "product_code": "KÓD_Z_CENÍKU",
      "product_name": "NÁZEV_Z_CENÍKU",
      "quantity": ČÍSLO,
      "unit": "JEDNOTKA",
      "unit_price": ČÍSLO,
      "discount_pct": 0,
      "notes": "volitelná poznámka"
    }
  ],
  "summary": "Stručný souhrn poptávky",
  "confidence": 0.0_až_1.0
}
4. Pokud položku v ceníku nenajdeš, použij product_code "NENALEZENO" a odhadni cenu jako null (vynech pole unit_price).
5. NIKDY nevymýšlej kódy produktů. Vždy používej přesné kódy z ceníku.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `PŘEDMĚT E-MAILU: ${emailSubject || '(bez předmětu)'}\n\nTEXT E-MAILU:\n${emailBody}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'AI processing failed' }, { status: 502 })
    }

    const aiData = await response.json()
    const rawText = aiData.content?.[0]?.text ?? ''

    let parsed: AIQuoteResponse
    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Try to extract JSON from response
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
      parsed = JSON.parse(match[0])
    }

    // Validate item codes against products DB
    const productMap = new Map((products ?? []).map((p) => [p.code.toUpperCase(), p]))

    const validatedItems = parsed.items.map((item: ParsedQuoteItem) => {
      const dbProduct = productMap.get(item.product_code.toUpperCase())
      return {
        ...item,
        unit_price: item.unit_price ?? dbProduct?.price ?? 0,
        validation_flag: dbProduct ? 'ok' : 'unmatched',
      }
    })

    // Save session to DB
    const { data: session } = await supabase
      .from('quote_sessions')
      .insert({
        company_id: profile.company_id,
        created_by: user.id,
        email_subject: emailSubject,
        email_body: emailBody,
        raw_ai_response: parsed,
        status: 'draft',
      })
      .select('id')
      .single()

    return NextResponse.json({
      sessionId: session?.id,
      items: validatedItems,
      summary: parsed.summary,
      confidence: parsed.confidence,
    })
  } catch (err) {
    console.error('Quote analysis error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
