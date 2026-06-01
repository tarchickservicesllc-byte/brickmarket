'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, subscriptionLabel } from '@/lib/utils'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/portfolio', label: 'Portfolio', icon: '📦' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛒' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/intel', label: 'Price Intel', icon: '📊' },
  { href: '/trades', label: 'Trade Matchmaker', icon: '🔄', tier: 'pro' },
  { href: '/deal-scanner', label: 'Deal Scanner', icon: '🔍', tier: 'deal_scanner' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/budget', label: 'Budget Builder', icon: '💰', tier: 'pro' },
  { href: '/ai-valuation', label: 'Photo-to-Price', icon: '📸' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

interface Props {
  profile: Profile | null
}

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const tier = profile?.subscription_tier ?? 'free'

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-gray-100 bg-white sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="text-xl font-extrabold text-brick">🧱 BrickMarket</Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLocked = item.tier === 'deal_scanner' && tier !== 'deal_scanner'
            || item.tier === 'pro' && tier === 'free'

          return (
            <Link
              key={item.href}
              href={isLocked ? '/settings?upgrade=1' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brick/10 text-brick'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isLocked && 'opacity-50'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isLocked && <span className="text-xs text-gray-400">🔒</span>}
            </Link>
          )
        })}
      </nav>

      {/* User / tier */}
      <div className="px-4 py-4 border-t border-gray-100">
        {tier === 'free' ? (
          <Link
            href="/settings?upgrade=1"
            className="block w-full text-center bg-brick hover:bg-brick-dark text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
          >
            Upgrade to Pro →
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {profile?.username ?? 'You'}
            </span>
            <span className="text-xs bg-brick/10 text-brick font-semibold px-2 py-0.5 rounded-full">
              {subscriptionLabel(tier)}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
