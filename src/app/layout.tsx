import type { Metadata } from 'next'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Padigiling CRM',
  description: 'CRM Padigiling — Manajemen order katering via WhatsApp & multi-channel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
