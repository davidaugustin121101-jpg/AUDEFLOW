'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  LogOut,
  Zap,
  History,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Přehled', icon: LayoutDashboard },
  { href: '/pricelist', label: 'Ceníky', icon: FileSpreadsheet },
  { href: '/quotes', label: 'Nabídky', icon: History },
  { href: '/settings', label: 'Nastavení', icon: Settings },
]

interface SidebarProps {
  profile: {
    full_name: string | null
    role: string
    companies: { name: string } | null
  } | null
  user: { email?: string }
}

export function Sidebar({ profile, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() ?? '?'

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center gap-2 border-b border-gray-100">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">Audeflow AI</span>
      </div>

      {/* Company badge */}
      {profile?.companies && (
        <div className="px-4 py-3 mx-3 mt-3 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Firma</p>
          <p className="text-sm font-semibold text-blue-900 truncate">{profile.companies.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-blue-600' : 'text-gray-400')} />
                {label}
              </div>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name ?? user.email}
            </p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-700"
            onClick={handleSignOut}
            title="Odhlásit se"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
