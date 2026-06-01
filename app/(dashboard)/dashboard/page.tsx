import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [portfolioRes, listingsRes, messagesRes, flipsRes, dealsRes] = await Promise.all([
    supabase.from('portfolio_items').select('id, purchase_price, quantity').eq('user_id', user.id),
    supabase.from('listings').select('id, price, status').eq('seller_id', user.id),
    supabase.from('messages').select('id', { count: 'exact' }).eq('recipient_id', user.id).eq('is_read', false),
    supabase.from('flip_entries').select('profit_dollars, roi_percent').eq('user_id', user.id),
    supabase.from('deals_found').select('id, raw_title, listed_price, estimated_value, roi_percent, location, listing_url, found_at').eq('is_active', true).order('found_at', { ascending: false }).limit(5),
  ])

  const totalPortfolioValue = (portfolioRes.data ?? []).reduce((sum, item) => sum + (item.purchase_price ?? 0) * item.quantity, 0)
  const activeListings = (listingsRes.data ?? []).filter(l => l.status === 'active').length
  const soldListings = (listingsRes.data ?? []).filter(l => l.status === 'sold')
  const totalRevenue = soldListings.reduce((sum, l) => sum + l.price, 0)
  const unreadMessages = messagesRes.count ?? 0
  const totalProfit = (flipsRes.data ?? []).reduce((sum, f) => sum + (f.profit_dollars ?? 0), 0)
  const avgRoi = flipsRes.data?.length
    ? (flipsRes.data.reduce((sum, f) => sum + (f.roi_percent ?? 0), 0) / flipsRes.data.length)
    : 0

  const stats = [
    { label: 'Portfolio Value', value: formatCurrency(totalPortfolioValue), icon: '📦', href: '/portfolio', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Listings', value: activeListings.toString(), icon: '🛒', href: '/marketplace', color: 'bg-green-50 text-green-600' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: '💵', href: '/marketplace', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Profit', value: formatCurrency(totalProfit), icon: '📈', href: '/leaderboard', color: 'bg-brick/5 text-brick' },
    { label: 'Avg ROI', value: `${avgRoi.toFixed(1)}%`, icon: '🔥', href: '/leaderboard', color: 'bg-orange-50 text-orange-600' },
    { label: 'Unread Messages', value: unreadMessages.toString(), icon: '💬', href: '/messages', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome back. Here&apos;s your snapshot.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg mb-2 ${s.color}`}>{s.icon}</div>
            <div className="text-xl font-black text-text-main">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/marketplace/new', label: 'Create Listing', icon: '➕' },
              { href: '/intel', label: 'Flip Score', icon: '📊' },
              { href: '/ai-valuation', label: 'Photo Valuation', icon: '📸' },
              { href: '/budget', label: 'Budget Builder', icon: '💰' },
              { href: '/trades', label: 'Trade Matchmaker', icon: '🔄' },
              { href: '/deal-scanner', label: 'Deal Scanner', icon: '🔍' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="flex items-center gap-2 p-3 rounded-xl bg-surface hover:bg-brick/5 transition-colors text-sm font-medium">
                <span>{a.icon}</span>{a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent deals */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Deals Found</h2>
            <Link href="/deal-scanner" className="text-xs text-brick font-medium hover:underline">View all →</Link>
          </div>
          {(dealsRes.data ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">No deals found yet. Set up Deal Scanner to get alerts.</p>
              <Link href="/deal-scanner" className="mt-3 inline-block text-brick text-sm font-medium hover:underline">Set up Deal Scanner →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(dealsRes.data ?? []).map(deal => (
                <a key={deal.id} href={deal.listing_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deal.raw_title}</p>
                    <p className="text-xs text-gray-400">{deal.location} · ${deal.listed_price}</p>
                  </div>
                  <div className="text-green-600 font-bold text-sm flex-shrink-0">+{Math.round(deal.roi_percent ?? 0)}%</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
