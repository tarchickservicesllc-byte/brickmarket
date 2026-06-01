'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/portfolio', label: 'Portfolio', icon: '📦' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛒' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/intel', label: 'Intel', icon: '📊' },
  { href: '/trades', label: 'Trades', icon: '🔄' },
  { href: '/deal-scanner', label: 'Deals', icon: '🔍' },
  { href: '/leaderboard', label: 'Board', icon: '🏆' },
  { href: '/budget', label: 'Budget', icon: '💰' },
  { href: '/ai-valuation', label: 'AI', icon: '📸' },
]

interface Props {
  profile: Profile | null
}

export default function Topbar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
        <Link href="/dashboard" className="text-lg font-extrabold text-brick">🧱 BrickMarket</Link>
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-xl">💬</Link>
          <button onClick={() => setMenuOpen(o => !o)} className="text-xl">☰</button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <span className="font-bold text-brick">🧱 BrickMarket</span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-500">✕</button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href ? 'bg-brick/10 text-brick' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t space-y-2">
              <Link href="/settings" onClick={() => setMenuOpen(false)} className="block text-sm text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">⚙️ Settings</Link>
              <button onClick={signOut} className="w-full text-left text-sm text-red-500 px-3 py-2 rounded-lg hover:bg-red-50">Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop topbar — username/signout */}
      <div className="hidden md:flex items-center justify-end px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {profile?.full_name ?? profile?.username ?? ''}
          </span>
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-red-500 transition-colors">Sign out</button>
        </div>
      </div>
    </>
  )
}
