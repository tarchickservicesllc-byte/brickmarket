'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import { Menu, X, TrendingUp, LayoutDashboard, Package, ShoppingCart, MessageSquare, BarChart2, RefreshCw, Search, Trophy, PiggyBank, Camera, Settings, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: Package },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/intel', label: 'Price Intel', icon: BarChart2 },
  { href: '/trades', label: 'Trades', icon: RefreshCw },
  { href: '/deal-scanner', label: 'Deals', icon: Search },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/budget', label: 'Budget', icon: PiggyBank },
  { href: '/ai-valuation', label: 'AI Valuation', icon: Camera },
]

interface Props {
  profile: Profile | null
}

export default function Topbar({ profile }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const pageTitle = navItems.find(i => pathname === i.href || pathname.startsWith(i.href + '/'))?.label ?? 'BrickMarket'

  return (
    <>
      {/* Desktop topbar */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div>
          <h1 className="text-base font-semibold text-slate-900">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center uppercase">
              {profile?.username?.[0] ?? 'U'}
            </div>
            <span className="font-medium">{profile?.full_name ?? profile?.username}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile topbar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded-md flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-900">BrickMarket</span>
        </Link>
        <button onClick={() => setMenuOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          {menuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <span className="font-bold text-slate-900">Menu</span>
              <button onClick={() => setMenuOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-4 py-4 border-t border-slate-200 space-y-2">
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
