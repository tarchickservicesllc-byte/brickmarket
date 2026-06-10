'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, subscriptionLabel } from '@/lib/utils'
import type { Profile } from '@/types/database'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare, BarChart2,
  RefreshCw, Search, Trophy, PiggyBank, Camera, Settings, Lock, TrendingUp,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/portfolio',    label: 'Portfolio',         icon: Package },
  { href: '/marketplace',  label: 'Marketplace',       icon: ShoppingCart },
  { href: '/messages',     label: 'Messages',          icon: MessageSquare },
  { href: '/intel',        label: 'Price Intel',       icon: BarChart2 },
  { href: '/trades',       label: 'Trade Matchmaker',  icon: RefreshCw, tier: 'pro' },
  { href: '/deal-scanner', label: 'Deal Scanner',      icon: Search, tier: 'deal_scanner' },
  { href: '/leaderboard',  label: 'Leaderboard',       icon: Trophy },
  { href: '/budget',       label: 'Budget Builder',    icon: PiggyBank, tier: 'pro' },
  { href: '/ai-valuation', label: 'Photo Valuation',   icon: Camera },
  { href: '/settings',     label: 'Settings',          icon: Settings },
]

interface Props { profile: Profile | null }

export default function Sidebar({ profile }: Props) {
  const pathname = usePathname()
  const tier = profile?.subscription_tier ?? 'free'

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-slate-700 bg-slate-800 sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">BrickMarket</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isLocked = (item.tier === 'deal_scanner' && tier !== 'deal_scanner') ||
            (item.tier === 'pro' && tier === 'free')
          const Icon = item.icon

          return (
            <Link key={item.href} href={isLocked ? '/settings?upgrade=1' : item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                isLocked && 'opacity-40'
              )}>
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span className="flex-1">{item.label}</span>
              {isLocked && <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA / tier badge */}
      <div className="px-4 py-4 border-t border-slate-700">
        {tier === 'free' ? (
          <Link href="/settings?upgrade=1"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
            <TrendingUp className="w-4 h-4" />
            Upgrade to Pro
          </Link>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400 truncate">{profile?.username}</span>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
              tier === 'deal_scanner' ? 'bg-emerald-900/50 text-emerald-300' : 'bg-blue-900/50 text-blue-300')}>
              {subscriptionLabel(tier)}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
