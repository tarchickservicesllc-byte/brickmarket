'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, MapPin, Bell, Tag, ShoppingBag } from 'lucide-react'

interface DealWatch {
  id: string
  zip_code: string | null
  radius_miles: number
  max_price: number | null
  notify_sms: boolean
  notify_email: boolean
  is_active: boolean
}

interface Deal {
  id: string
  raw_title: string | null
  listed_price: number | null
  estimated_value: number | null
  roi_percent: number | null
  location: string | null
  listing_url: string
  found_at: string
  platform: string
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook_marketplace: 'Facebook Marketplace',
  walmart: 'Walmart',
  target: 'Target',
  amazon: 'Amazon',
  lego_official: 'LEGO.com',
  craigslist: 'Craigslist',
  offerup: 'OfferUp',
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook_marketplace: 'bg-blue-100 text-blue-700',
  walmart: 'bg-yellow-100 text-yellow-700',
  target: 'bg-red-100 text-red-700',
  amazon: 'bg-orange-100 text-orange-700',
  lego_official: 'bg-green-100 text-green-700',
  craigslist: 'bg-purple-100 text-purple-700',
  offerup: 'bg-pink-100 text-pink-700',
}

export default function DealScannerPage() {
  const supabase = createClient()
  const [tier, setTier] = useState<string>('free')
  const [watch, setWatch] = useState<DealWatch | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'marketplace' | 'retail'>('all')
  const [form, setForm] = useState({ zip_code: '', radius_miles: '50', max_price: '', notify_sms: true, notify_email: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
      setTier(profile?.subscription_tier ?? 'free')
      const { data: watches } = await supabase.from('deal_watches').select('*').eq('user_id', user.id).limit(1).single()
      if (watches) {
        setWatch(watches)
        setForm({
          zip_code: watches.zip_code ?? '',
          radius_miles: watches.radius_miles?.toString() ?? '50',
          max_price: watches.max_price?.toString() ?? '',
          notify_sms: watches.notify_sms,
          notify_email: watches.notify_email,
        })
      }
      const { data: recentDeals } = await supabase.from('deals_found').select('*').eq('is_active', true).order('found_at', { ascending: false }).limit(50)
      setDeals(recentDeals ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveWatch() {
    if (!form.zip_code) { toast.error('Enter a zip code'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = {
      user_id: user.id,
      zip_code: form.zip_code,
      radius_miles: parseInt(form.radius_miles) || 50,
      max_price: form.max_price ? parseFloat(form.max_price) : null,
      notify_sms: form.notify_sms,
      notify_email: form.notify_email,
      is_active: true,
    }
    let error
    if (watch) {
      ({ error } = await supabase.from('deal_watches').update(payload).eq('id', watch.id))
    } else {
      const res = await supabase.from('deal_watches').insert(payload).select().single()
      error = res.error
      if (res.data) setWatch(res.data)
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Settings saved!')
  }

  const retailPlatforms = ['walmart', 'target', 'amazon', 'lego_official']
  const marketplacePlatforms = ['facebook_marketplace', 'craigslist', 'offerup']

  const filteredDeals = deals.filter(d => {
    if (activeTab === 'retail') return retailPlatforms.includes(d.platform)
    if (activeTab === 'marketplace') return marketplacePlatforms.includes(d.platform)
    return true
  })

  const retailDealsCount = deals.filter(d => retailPlatforms.includes(d.platform)).length
  const marketplaceDealsCount = deals.filter(d => marketplacePlatforms.includes(d.platform)).length

  if (tier !== 'deal_scanner') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Deal Scanner</h1>
        <p className="text-slate-500 mb-2">Automatically scans Facebook Marketplace, Walmart, Target, Amazon, and LEGO.com daily for underpriced LEGO sets.</p>
        <p className="text-slate-500 mb-6">Requires Pro membership ($20/mo).</p>
        <a href="/settings?upgrade=1" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl transition-colors inline-block">Upgrade to Pro</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Deal Scanner</h1>
        <p className="text-slate-500 text-sm mt-1">Scans Facebook Marketplace, Walmart, Target, Amazon, and LEGO.com daily for deals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-slate-900">{deals.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total Deals Found</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-blue-700">{retailDealsCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Retail Sales</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-green-600">{marketplaceDealsCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Marketplace Deals</div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-blue-700" />
          <h2 className="font-semibold text-slate-900">Alert Settings</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Zip Code (for Marketplace scanning)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" placeholder="e.g. 44114" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Search Radius: {form.radius_miles} miles</label>
            <input type="range" min="10" max="150" step="10" value={form.radius_miles} onChange={e => setForm(f => ({ ...f, radius_miles: e.target.value }))} className="w-full accent-blue-700 mt-2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Price ($)</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="number" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" placeholder="No limit" />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Notifications</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.notify_email} onChange={e => setForm(f => ({ ...f, notify_email: e.target.checked }))} className="accent-blue-700" />
              Email alerts
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.notify_sms} onChange={e => setForm(f => ({ ...f, notify_sms: e.target.checked }))} className="accent-blue-700" />
              SMS alerts
            </label>
          </div>
        </div>
        <button onClick={saveWatch} disabled={saving} className="mt-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm">
          {saving ? 'Saving…' : watch ? 'Update Settings' : 'Activate Scanner'}
        </button>
      </div>

      {/* Deals Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Deals Found</h2>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'marketplace', 'retail'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab === 'all' ? 'All' : tab === 'marketplace' ? 'Marketplace' : 'Retail'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No deals found yet</p>
            <p className="text-slate-400 text-sm mt-1">The scanner runs daily at 8–9am. Check back tomorrow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDeals.map(deal => {
              const platformLabel = PLATFORM_LABELS[deal.platform] ?? deal.platform
              const platformColor = PLATFORM_COLORS[deal.platform] ?? 'bg-slate-100 text-slate-600'
              const isRetail = retailPlatforms.includes(deal.platform)
              return (
                <a key={deal.id} href={deal.listing_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${platformColor}`}>{platformLabel}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">{deal.raw_title}</p>
                    <p className="text-xs text-slate-400">{deal.location} · {new Date(deal.found_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-slate-900">{deal.listed_price ? formatCurrency(deal.listed_price) : '—'}</div>
                    {deal.estimated_value && deal.estimated_value > (deal.listed_price ?? 0) && (
                      <div className="text-xs text-slate-400 line-through">{formatCurrency(deal.estimated_value)}</div>
                    )}
                    <div className="text-xs font-semibold text-green-600 mt-0.5">
                      {isRetail ? `${Math.round(deal.roi_percent ?? 0)}% off` : `+${Math.round(deal.roi_percent ?? 0)}% ROI`}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
