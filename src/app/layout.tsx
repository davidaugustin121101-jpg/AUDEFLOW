import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Audeflow AI – Faktury do iDokladu jedním kliknutím',
  description: 'Přetáhni PDF fakturu, Claude AI ji přečte a navrhne účetní kód. Odešli do iDokladu nebo Fakturoidu jedním kliknutím. Žádné ruční přepisování.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
