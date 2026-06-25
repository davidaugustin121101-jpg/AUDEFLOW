export type InvoiceStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'sent_to_accounting'
  | 'error'
  | 'needs_manual_check'

export interface ProcessedInvoice {
  id: string
  user_id: string
  email_connection_id: string | null
  dodavatel_nazev: string | null
  dodavatel_ico: string | null
  dodavatel_dic: string | null
  cislo_faktury: string | null
  datum_vystaveni: string | null
  datum_splatnosti: string | null
  variabilni_symbol: string | null
  castka_bez_dph: number | null
  sazba_dph: number | null
  castka_dph: number | null
  castka_celkem: number | null
  mena: string
  popis_plneni: string | null
  iban: string | null
  // Accounting code proposed by Claude
  ucetni_kod: string | null
  ucetni_kod_nazev: string | null
  ucetni_kod_duvod: string | null
  ucetni_kod_confidence: number | null
  // Overall confidence
  confidence: number | null
  problemy: string[] | null
  raw_extraction: Record<string, unknown> | null
  status: InvoiceStatus
  accounting_provider: string | null
  accounting_document_id: string | null
  accounting_connection_id: string | null
  original_email_id: string | null
  original_filename: string | null
  sender_email: string | null
  received_at: string | null
  created_at: string
  processed_at: string | null
  updated_at: string
}

export interface EmailConnection {
  id: string
  user_id: string
  provider: 'gmail' | 'outlook' | 'imap'
  email_address: string
  token_expiry: string | null
  imap_host: string | null
  imap_port: number | null
  is_active: boolean
  last_checked_at: string | null
  created_at: string
}

export interface AccountingConnection {
  id: string
  user_id: string
  provider: 'idoklad' | 'fakturoid'
  account_slug: string | null
  is_active: boolean
  created_at: string
}

export interface InvoiceSettings {
  user_id: string
  auto_approve_below: number | null
  notify_on_new: boolean
  notify_email: string | null
}
