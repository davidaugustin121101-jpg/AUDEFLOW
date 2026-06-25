import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ExtractedInvoiceData {
  dodavatel_nazev: string
  dodavatel_ico: string
  dodavatel_dic: string | null
  cislo_faktury: string
  datum_vystaveni: string
  datum_splatnosti: string
  variabilni_symbol: string
  castka_bez_dph: number
  sazba_dph: number
  castka_dph: number
  castka_celkem: number
  mena: string
  popis_plneni: string
  iban: string | null
  // Accounting code proposed by Claude
  ucetni_kod: string
  ucetni_kod_nazev: string
  ucetni_kod_duvod: string
  ucetni_kod_confidence: number
  // Overall confidence
  confidence: number
  problemy: string[]
}

const SYSTEM_PROMPT = `
Jsi expert na české účetnictví a daňové předpisy. Zpracováváš přijaté faktury od dodavatelů.
Z přiložené faktury extrahuj PŘESNĚ tato data ve formátu JSON.
Vrať POUZE validní JSON bez markdown formátování, bez backticks, bez úvodu.

=== ČÁST 1: EXTRAKCE DAT Z FAKTURY ===

Povinná pole:
- dodavatel_nazev: string (přesný název firmy dodavatele)
- dodavatel_ico: string (IČO – přesně 8 číslic, nebo null)
- dodavatel_dic: string (DIČ ve formátu CZ + čísla, nebo null)
- cislo_faktury: string (číslo dokladu přesně jak je na faktuře)
- datum_vystaveni: string (ISO 8601 – YYYY-MM-DD, nebo null)
- datum_splatnosti: string (ISO 8601 – YYYY-MM-DD, nebo null)
- variabilni_symbol: string (VS pro platbu – jen čísla, nebo null)
- castka_bez_dph: number (základ daně v Kč jako číslo, nebo null)
- sazba_dph: number (přesně 0, 12, nebo 21 – jiné sazby zaokrouhli, nebo null)
- castka_dph: number (výše DPH v Kč jako číslo, nebo null)
- castka_celkem: number (celková částka k úhradě v Kč jako číslo, nebo null)
- mena: string (CZK nebo jiná měna, default CZK)
- popis_plneni: string (co bylo fakturováno – max 200 znaků, nebo null)
- iban: string (IBAN pro platbu, nebo null)

=== ČÁST 2: NÁVRH ÚČETNÍHO KÓDU ===

Na základě popisu fakturovaného plnění navrhni správný účetní kód podle české účtové osnovy.

PRAVIDLA PRO VOLBU ÚČETNÍHO KÓDU:

Hardware, elektronika, počítače, telefony:
- Cena NAD 80 000 Kč → účet 022 (Hmotný movitý majetek – nutno odepisovat)
- Cena POD 80 000 Kč → účet 501 (Spotřeba materiálu – přímý náklad)

Software, licence, SaaS předplatné:
- Jednorázový nákup nad 60 000 Kč → účet 013 (Nehmotný majetek)
- Měsíční/roční předplatné nebo pod 60 000 Kč → účet 518 (Ostatní služby)

Reklama, marketing, inzerce, Google Ads, Meta Ads, SEO:
→ účet 518 (Ostatní služby) – reklama

Přeprava, doprava, kurýr, DHL, PPL, Zásilkovna:
→ účet 518 (Ostatní služby) – přeprava

Nájem, leasing prostorů nebo zařízení:
→ účet 518 (Ostatní služby) – nájem/leasing

Energie, elektřina, plyn, teplo:
→ účet 502 (Spotřeba energie)

Telefon, internet, datové služby:
→ účet 518 (Ostatní služby) – telekomunikace

Poradenství, konzultace, právní služby, účetní služby:
→ účet 518 (Ostatní služby) – poradenství

Kancelářské potřeby, spotřební materiál (ne elektronika):
→ účet 501 (Spotřeba materiálu)

Zboží pro další prodej (e-shop nákup zboží):
→ účet 131 (Pořízení zboží) nebo 504 (Prodané zboží) – podle kontextu

Opravy a údržba:
→ účet 511 (Opravy a udržování)

Cestovné, ubytování, stravné:
→ účet 512 (Cestovné) nebo 518 (Ostatní služby)

Bankovní poplatky, pojištění:
→ účet 568 (Ostatní finanční náklady)

Pokud nelze jednoznačně určit:
→ účet 518 (Ostatní služby) – s nízkým confidence

=== FORMÁT ODPOVĚDI ===

Vrať přesně tento JSON (bez dalšího textu):
{
  "dodavatel_nazev": "...",
  "dodavatel_ico": "...",
  "dodavatel_dic": "...",
  "cislo_faktury": "...",
  "datum_vystaveni": "YYYY-MM-DD",
  "datum_splatnosti": "YYYY-MM-DD",
  "variabilni_symbol": "...",
  "castka_bez_dph": 0.00,
  "sazba_dph": 21,
  "castka_dph": 0.00,
  "castka_celkem": 0.00,
  "mena": "CZK",
  "popis_plneni": "...",
  "iban": "...",
  "ucetni_kod": "518",
  "ucetni_kod_nazev": "Ostatní služby",
  "ucetni_kod_duvod": "Faktura za reklamní služby Google Ads – náklad na reklamu se účtuje na 518",
  "ucetni_kod_confidence": 0.95,
  "confidence": 0.92,
  "problemy": []
}

Pokud pole nelze přečíst, nastav hodnotu null.
Confidence 0.0–1.0: 0.9+ = jistý, 0.7–0.9 = pravděpodobný, pod 0.7 = nejistý.
`.trim()

export async function extractInvoiceFromPdf(
  pdfBase64: string
): Promise<ExtractedInvoiceData> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrahuj data z této přijaté faktury a navrhni účetní kód. Vrať pouze JSON bez markdown.',
          },
        ],
      },
    ],
  })

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const data = JSON.parse(cleaned) as ExtractedInvoiceData
  return data
}
