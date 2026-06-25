'use client'

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Clock, XCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProcessedInvoice } from '@/types/invoices'
import { ConfidenceBadge } from './ConfidenceBadge'

const STATUS_CONFIG = {
  pending_review: {
    label: 'Ke schválení',
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    dot: 'bg-blue-500',
  },
  needs_manual_check: {
    label: 'Zkontrolovat',
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  sent_to_accounting: {
    label: 'Odesláno',
    icon: Send,
    color: 'text-green-600 bg-green-50 border-green-200',
    dot: 'bg-green-500',
  },
  approved: {
    label: 'Schváleno',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50 border-green-200',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Zamítnuto',
    icon: XCircle,
    color: 'text-gray-500 bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  error: {
    label: 'Chyba',
    icon: XCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    dot: 'bg-red-500',
  },
}

interface InvoiceCardProps {
  invoice: ProcessedInvoice
  compact?: boolean
}

export function InvoiceCard({ invoice, compact }: InvoiceCardProps) {
  const config = STATUS_CONFIG[invoice.status]
  const StatusIcon = config.icon
  const needsAction =
    invoice.status === 'pending_review' || invoice.status === 'needs_manual_check'

  const formattedAmount = invoice.castka_celkem
    ? new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: invoice.mena ?? 'CZK',
        maximumFractionDigits: 0,
      }).format(invoice.castka_celkem)
    : '—'

  const formattedDate = invoice.datum_splatnosti
    ? new Intl.DateTimeFormat('cs-CZ').format(new Date(invoice.datum_splatnosti))
    : null

  return (
    <Link href={`/faktury/${invoice.id}`}>
      <div
        className={cn(
          'group flex items-center gap-4 px-4 py-4 bg-white rounded-xl border transition-all hover:shadow-md hover:border-blue-200',
          needsAction ? 'border-gray-200' : 'border-gray-100 opacity-80',
          compact ? 'py-3' : 'py-4'
        )}
      >
        {/* Status dot */}
        <div
          className={cn(
            'h-2.5 w-2.5 rounded-full shrink-0 mt-0.5',
            config.dot
          )}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {invoice.dodavatel_nazev ?? 'Neznámý dodavatel'}
            </p>
            {invoice.status === 'needs_manual_check' && (
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {invoice.cislo_faktury ? `Č. ${invoice.cislo_faktury}` : ''}
            {invoice.cislo_faktury && formattedDate ? ' · ' : ''}
            {formattedDate ? `Splatnost ${formattedDate}` : ''}
          </p>
        </div>

        {/* Amount + confidence */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{formattedAmount}</p>
          {!compact && (
            <ConfidenceBadge value={invoice.confidence} className="mt-1" />
          )}
        </div>

        {/* Status badge */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0',
            config.color
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </div>
      </div>
    </Link>
  )
}
