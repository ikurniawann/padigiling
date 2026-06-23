'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  Users2,
  GitBranch,
  Building2,
  ShoppingBag,
  ChefHat,
  PlusCircle,
  Receipt,
  BarChart2,
  Database,
  Settings,
  LogOut,
  Package,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
}

const nav: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/leads',        label: 'Leads',        icon: Users2 },
  { href: '/pipeline',     label: 'Pipeline',     icon: GitBranch },
  { href: '/customers',    label: 'Customers',    icon: Building2 },
  { href: '/orders',       label: 'Orders',       icon: ShoppingBag },
  { href: '/create-order', label: 'Create Order', icon: PlusCircle },
  { href: '/invoices',     label: 'Invoice',      icon: Receipt },
  { href: '/products',     label: 'Produk',       icon: Package },
  { href: '/production',   label: 'Production',   icon: ChefHat },
  { href: '/reports',      label: 'Reports',      icon: BarChart2 },
  { href: '/master-data',  label: 'Master Data',  icon: Database },
  { href: '/settings',     label: 'Settings',     icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/40 bg-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/40 px-5 py-5">
          <div className="flex h-9 w-[72px] items-center justify-center overflow-hidden rounded-xl bg-brand px-2 shadow-lg shadow-red-200">
            <img src="/padigiling.png" alt="Padigiling" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">Padigiling</p>
            <p className="text-[10px] leading-tight text-stone-500">CRM</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'text-stone-600 hover:bg-brand-soft hover:text-brand'
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/40 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar width */}
      <main className="ml-60 min-h-screen flex-1 p-7">
        {children}
      </main>
    </div>
  )
}
