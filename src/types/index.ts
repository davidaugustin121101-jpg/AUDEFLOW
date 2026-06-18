export type Plan = 'start' | 'business' | 'enterprise'
export type UserRole = 'owner' | 'admin' | 'member'
export type FileType = 'excel' | 'csv' | 'pdf'
export type FileStatus = 'processing' | 'ready' | 'error'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type RuleType = 'general' | 'discount' | 'shipping' | 'other'
export type ValidationFlag = 'ok' | 'unmatched' | 'price_override'

export interface Company {
  id: string
  name: string
  slug: string
  plan: Plan
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id: string | null
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface PricelistFile {
  id: string
  company_id: string
  uploaded_by: string
  file_name: string
  storage_path: string
  file_type: FileType
  row_count: number | null
  status: FileStatus
  error_message: string | null
  created_at: string
}

export interface Product {
  id: string
  company_id: string
  pricelist_id: string | null
  code: string
  name: string
  unit: string | null
  price: number | null
  currency: string
  stock_qty: number | null
  extra_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CompanyRule {
  id: string
  company_id: string
  title: string
  content: string | null
  storage_path: string | null
  rule_type: RuleType
  is_active: boolean
  created_at: string
}

export interface QuoteSession {
  id: string
  company_id: string
  created_by: string
  email_subject: string | null
  email_body: string | null
  raw_ai_response: unknown | null
  status: QuoteStatus
  created_at: string
  updated_at: string
}

export interface QuoteItem {
  id: string
  session_id: string
  product_id: string | null
  product_code: string
  product_name: string
  unit: string | null
  quantity: number
  unit_price: number
  discount_pct: number | null
  total_price: number
  validation_flag: ValidationFlag | null
  sort_order: number
}

// Column mapping for pricelist import
export interface ColumnMapping {
  code: string
  name: string
  price: string
  unit?: string
  stock_qty?: string
}

// AI-parsed quote item (before validation)
export interface ParsedQuoteItem {
  product_code: string
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  discount_pct?: number
  notes?: string
}

export interface AIQuoteResponse {
  items: ParsedQuoteItem[]
  summary?: string
  confidence?: number
}
