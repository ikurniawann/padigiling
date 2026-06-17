'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const nav = [
  ['/dashboard', 'Dashboard'],
  ['/leads', 'Leads'],
  ['/pipeline', 'Pipeline'],
  ['/customers', 'Customers'],
  ['/orders', 'Orders'],
  ['/production', 'Production'],
  ['/create-order', 'Create Order'],
  ['/invoices', 'Invoice'],
  ['/reports', 'Reports'],
  ['/master-data', 'Master Data'],
  ['/settings', 'Settings'],
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-6 px-7 py-3 backdrop-blur-2xl bg-white/60 border-b border-white/40 shadow-sm">
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="flex h-9 w-32 items-center justify-center overflow-hidden rounded-xl bg-brand px-3 shadow-lg shadow-red-200">
            <img src="/padigiling.png" alt="Padigiling" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold">Padigiling CRM</h1>
            <p className="text-[11px] text-stone-500">Lead • Order • Pipeline</p>
          </div>
        </div>
        <nav className="flex flex-1 gap-1 overflow-auto whitespace-nowrap">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                path === href
                  ? 'bg-brand-soft text-brand'
                  : 'text-stone-600 hover:bg-brand-soft hover:text-brand'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="btn">Logout</button>
      </header>
      <main className="mx-auto max-w-[1440px] p-7">{children}</main>
    </div>
  )
}