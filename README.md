# Audeflow AI – Faktury

**PDF faktura → Claude AI → iDoklad / Fakturoid jedním kliknutím**

Přetáhni PDF fakturu od dodavatele. Claude AI ji přečte, navrhne účetní kód a odešle přímo do iDokladu nebo Fakturoidu. Žádné ruční přepisování, žádný export souboru.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** – PostgreSQL + Auth + RLS + Vault
- **Anthropic Claude** – `claude-sonnet-4-6` s PDF vision
- **iDoklad REST API v3** – OAuth2 client_credentials
- **Fakturoid REST API v3** – Bearer token
- **Tailwind CSS v4**
- **Vercel** – hosting + cron

## Jak spustit lokálně

```bash
npm install
cp .env.example .env.local
# Vyplň hodnoty v .env.local
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000).

## Databáze (Supabase)

Spusť migrace v pořadí:

```bash
# V Supabase SQL Editoru nebo přes CLI:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_invoice_module.sql
supabase/migrations/003_ucetni_kod_idoklad_oauth.sql
```

## Klíčové routes

| URL | Popis |
|-----|-------|
| `/` | Landing page |
| `/register` | Registrace |
| `/login` | Přihlášení |
| `/faktury` | Seznam faktur |
| `/faktury/upload` | Drag & drop upload |
| `/faktury/[id]` | Detail faktury + schválení |
| `/settings/accounting` | Napojení iDoklad / Fakturoid |
| `/settings/email` | Napojení Gmail / Outlook / IMAP |
| `/api/extract` | POST – PDF upload → Claude extrakce |
| `/api/invoices/approve` | POST – odeslání do účetního systému |
| `/api/cron/check-emails` | Cron – kontrola emailu každých 15 min |

## Ceník

| Plán | Cena | Limit |
|------|------|-------|
| Free | 0 Kč/měs | 10 faktur |
| Starter | 299 Kč/měs | 100 faktur |
| Pro | 599 Kč/měs | Neomezeno |

Platby: ruční bankovní převod. Admin mění `plan` v tabulce `user_profiles` ručně.

## Deploy na Vercel

1. Propoj GitHub repo s Vercel
2. Nastav environment variables (viz `.env.example`)
3. Nastav custom domain `faktury.audeflow.cz` nebo podsložka

Cron job (`/api/cron/check-emails`) běží každých 15 minut – nakonfigurováno v `vercel.json`.

## Bezpečnost

- PDF soubory se nikde neukládají – zpracovávají se pouze v paměti
- API klíče jsou šifrované v Supabase Vault
- RLS aktivní na všech tabulkách
- Každá akce je logována do `invoice_audit_log`

---

Produkt [audeflow.cz](https://audeflow.cz) · podpora@audeflow.cz
