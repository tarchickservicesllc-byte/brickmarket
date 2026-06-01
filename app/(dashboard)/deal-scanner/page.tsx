'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

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

export default function DealScannerPage() {
 const supabase = createClient()
 const [tier, setTier] = useState<string>('free')
 const [watch, setWatch] = useState<DealWatch | null>(null)
 const [deals, setDeals] = useState<Deal[]>([])
 const [loading, setLoading] = useState(true)
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
 const { data: recentDeals } = await supabase.from('deals_found').select('*').eq('is_active', true).order('found_at', { ascending: false }).limit(20)
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
 toast.success('Deal Scanner saved!')
 }

 if (tier !== 'deal_scanner') {
 return (
 <div className="max-w-lg mx-auto py-20 text-center">
 <div className="text-5xl mb-4"></div>
 <h1 className="text-2xl font-bold mb-3">Deal Scanner</h1>
 <p className="text-gray-500 mb-6">Get real-time alerts when underpriced LEGO sets appear on Facebook Marketplace near you. Requires Deal Scanner subscription ($12/mo).</p>
 <a href="/settings?upgrade=1" className="bg-brick hover:bg-brick-dark text-white font-bold px-8 py-3 rounded-xl transition-colors inline-block">Upgrade to Deal Scanner</a>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl font-bold">Deal Scanner</h1>
 <p className="text-gray-500 text-sm">Automated scanning of Facebook Marketplace every 2 hours.</p>
 </div>

 {/* Setup */}
 <div className="bg-white rounded-2xl border border-gray-100 p-5">
 <h2 className="font-bold mb-4">Your Alert Settings</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Zip Code *</label>
 <input value={form.zip_code} onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" placeholder="e.g. 90210" />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Search Radius: {form.radius_miles} miles</label>
 <input type="range" min="10" max="150" step="10" value={form.radius_miles} onChange={e => setForm(f => ({ ...f, radius_miles: e.target.value }))} className="w-full accent-brick mt-1" />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Max Price ($)</label>
 <input type="number" value={form.max_price} onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" placeholder="Leave blank for any price" />
 </div>
 <div className="space-y-2 pt-1">
 <label className="block text-xs font-medium text-gray-600 mb-1">Notifications</label>
 <label className="flex items-center gap-2 text-sm cursor-pointer">
 <input type="checkbox" checked={form.notify_email} onChange={e => setForm(f => ({ ...f, notify_email: e.target.checked }))} className="accent-brick" />
 Email alerts
 </label>
 <label className="flex items-center gap-2 text-sm cursor-pointer">
 <input type="checkbox" checked={form.notify_sms} onChange={e => setForm(f => ({ ...f, notify_sms: e.target.checked }))} className="accent-brick" />
 SMS alerts
 </label>
 </div>
 </div>
 <button onClick={saveWatch} disabled={saving} className="mt-4 bg-brick hover:bg-brick-dark text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
 {saving ? 'Saving…' : watch ? 'Update Settings' : 'Activate Scanner'}
 </button>
 </div>

 {/* Deals feed */}
 <div>
 <h2 className="font-bold text-lg mb-3">Recent Deals Found</h2>
 {loading ? (
 <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
 ) : deals.length === 0 ? (
 <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
 <div className="text-4xl mb-2"></div>
 <p>No deals found yet. The scanner runs every 2 hours.</p>
 </div>
 ) : (
 <div className="space-y-2">
 {deals.map(deal => (
 <a key={deal.id} href={deal.listing_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-brick/20 transition-colors">
 <div className="flex-1 min-w-0">
 <div className="font-medium text-sm truncate">{deal.raw_title}</div>
 <div className="text-xs text-gray-400">{deal.platform?.replace(/_/g, ' ')} · {deal.location} · {new Date(deal.found_at).toLocaleDateString()}</div>
 </div>
 <div className="text-right flex-shrink-0">
 <div className="font-bold">{deal.listed_price ? formatCurrency(deal.listed_price) : '—'}</div>
 <div className="text-xs text-green-600 font-semibold">+{Math.round(deal.roi_percent ?? 0)}% ROI</div>
 </div>
 </a>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}
