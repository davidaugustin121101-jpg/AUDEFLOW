import type { ExtractedInvoiceData } from './claude'

const FAKTUROID_BASE = 'https://app.fakturoid.cz/api/v3'

export async function sendToFakturoid(
  token: string,
  accountSlug: string,
  data: ExtractedInvoiceData
): Promise<{ id: string; number: string }> {
  const payload = {
    issued_on: data.datum_vystaveni,
    due_on: data.datum_splatnosti,
    variable_symbol: data.variabilni_symbol,
    note: data.popis_plneni,
    currency: data.mena,
    supplier_name: data.dodavatel_nazev,
    supplier_registration_no: data.dodavatel_ico,
    ...(data.dodavatel_dic ? { supplier_vat_no: data.dodavatel_dic } : {}),
    lines: [
      {
        name: (data.popis_plneni ?? 'Přijatá faktura').slice(0, 200),
        quantity: '1',
        unit_name: 'ks',
        unit_price: String(data.castka_bez_dph ?? data.castka_celkem),
        vat_rate: String(data.sazba_dph ?? 21),
      },
    ],
    // Accounting code as tag for easy filtering in Fakturoid
    tags: [data.ucetni_kod ?? '518'],
  }

  const res = await fetch(
    `${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Audeflow.cz (podpora@audeflow.cz)',
      },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Fakturoid API chyba ${res.status}: ${err}`)
  }

  const result = (await res.json()) as { id: number; number: string }
  return { id: String(result.id), number: result.number }
}

export async function validateFakturoidToken(
  token: string,
  accountSlug: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${FAKTUROID_BASE}/accounts/${accountSlug}/expenses.json?page=1&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Audeflow.cz (podpora@audeflow.cz)',
        },
      }
    )
    return res.ok
  } catch {
    return false
  }
}
