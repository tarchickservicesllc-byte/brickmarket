'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { subscriptionLabel } from '@/lib/utils'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

function SettingsContent() {
 const supabase = createClient()
 const searchParams = useSearchParams()
 const [profile, setProfile] = useState<{ username: string; full_name: string | null; bio: string | null; location: string | null; phone: string | null; subscription_tier: string; stripe_account_id: string | null } | null>(null)
 const [form, setForm] = useState({ full_name: '', bio: '', location: '', phone: '' })
 const [saving, setSaving] = useState(false)
 const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)

 useEffect(() => {
 if (searchParams.get('success')) toast.success('Subscription activated!')
 if (searchParams.get('canceled')) toast.error('Payment canceled')
 if (searchParams.get('connect') === 'success') toast.success('Stripe Connect activated!')

 async function load() {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
 if (data) {
 setProfile(data)
 setForm({ full_name: data.full_name ?? '', bio: data.bio ?? '', location: data.location ?? '', phone: data.phone ?? '' })
 }
 }
 load()
 }, [])

 async function saveProfile() {
 setSaving(true)
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 const { error } = await supabase.from('profiles').update({
 full_name: form.full_name || null,
 bio: form.bio || null,
 location: form.location || null,
 phone: form.phone || null,
 }).eq('id', user.id)
 setSaving(false)
 if (error) { toast.error(error.message); return }
 toast.success('Profile saved!')
 }

 async function subscribe(priceId: string) {
 setUpgradeLoading(priceId)
 const res = await fetch('/api/stripe/checkout', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ priceId }),
 })
 const data = await res.json()
 setUpgradeLoading(null)
 if (data.url) window.location.href = data.url
 else toast.error('Could not start checkout')
 }

 async function manageSubscription() {
 const res = await fetch('/api/stripe/portal', { method: 'POST' })
 const data = await res.json()
 if (data.url) window.location.href = data.url
 else toast.error('No active subscription found')
 }

 async function connectStripe() {
 const res = await fetch('/api/stripe/connect', { method: 'POST' })
 const data = await res.json()
 if (data.url) window.location.href = data.url
 else toast.error('Could not start Stripe Connect')
 }

 const tier = profile?.subscription_tier ?? 'free'

 return (
 <div className="max-w-xl mx-auto space-y-6">
 <h1 className="text-2xl font-bold">Settings</h1>

 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
 <h2 className="font-bold">Profile</h2>
 {[
 { key: 'full_name', label: 'Full Name', placeholder: 'Your name' },
 { key: 'bio', label: 'Bio', placeholder: 'Tell the community about yourself…' },
 { key: 'location', label: 'Location', placeholder: 'City, State' },
 { key: 'phone', label: 'Phone (for SMS alerts)', placeholder: '+1 555 000 0000' },
 ].map(field => (
 <div key={field.key}>
 <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
 <input
 type="text"
 value={form[field.key as keyof typeof form]}
 onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30"
 placeholder={field.placeholder}
 />
 </div>
 ))}
 <button onClick={saveProfile} disabled={saving} className="bg-brick hover:bg-brick-dark text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
 {saving ? 'Saving…' : 'Save Profile'}
 </button>
 </div>

 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="font-bold">Subscription</h2>
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tier === 'deal_scanner' ? 'bg-green-100 text-green-700' : tier === 'pro' ? 'bg-brick/10 text-brick' : 'bg-gray-100 text-gray-500'}`}>
 {subscriptionLabel(tier)}
 </span>
 </div>

 {tier !== 'free' && (
 <button onClick={manageSubscription} className="text-sm text-brick hover:underline font-medium">Manage subscription →</button>
 )}

 {tier === 'free' && (
 <div className="space-y-3">
 <div className="border border-gray-100 rounded-xl p-4">
 <div className="flex items-center justify-between mb-2">
 <div><div className="font-semibold">Pro</div><div className="text-xs text-gray-400">Unlimited scans · Budget Builder · Trades</div></div>
 <div className="font-black text-lg">$9<span className="text-sm font-normal text-gray-400">/mo</span></div>
 </div>
 <button onClick={() => subscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY ?? '')} disabled={!!upgradeLoading} className="w-full bg-brick hover:bg-brick-dark text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
 {upgradeLoading ? 'Loading…' : 'Upgrade to Pro'}
 </button>
 </div>
 <div className="border border-gray-100 rounded-xl p-4">
 <div className="flex items-center justify-between mb-2">
 <div><div className="font-semibold">Deal Scanner</div><div className="text-xs text-gray-400">Everything in Pro + SMS + deal alerts</div></div>
 <div className="font-black text-lg">$12<span className="text-sm font-normal text-gray-400">/mo</span></div>
 </div>
 <button onClick={() => subscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DEAL_SCANNER ?? '')} disabled={!!upgradeLoading} className="w-full border border-brick text-brick hover:bg-brick/5 font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-60">
 {upgradeLoading ? 'Loading…' : 'Upgrade to Deal Scanner'}
 </button>
 </div>
 </div>
 )}

 {tier === 'pro' && (
 <div className="border border-gray-100 rounded-xl p-4">
 <div className="flex items-center justify-between mb-2">
 <div><div className="font-semibold">Deal Scanner</div><div className="text-xs text-gray-400">Add SMS alerts + automated deal scanning</div></div>
 <div className="font-black text-lg">$12<span className="text-sm font-normal text-gray-400">/mo</span></div>
 </div>
 <button onClick={() => subscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DEAL_SCANNER ?? '')} className="w-full border border-brick text-brick hover:bg-brick/5 font-semibold py-2 rounded-lg text-sm transition-colors">
 Upgrade to Deal Scanner
 </button>
 </div>
 )}
 </div>

 <div className="bg-white rounded-2xl border border-gray-100 p-6">
 <h2 className="font-bold mb-2">Seller Payouts</h2>
 <p className="text-sm text-gray-500 mb-4">Connect a Stripe account to receive payouts when your listings sell.</p>
 {profile?.stripe_account_id ? (
 <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><span></span> Stripe Connect active</div>
 ) : (
 <button onClick={connectStripe} className="bg-[#635BFF] hover:bg-[#5147e6] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
 Connect Stripe Account
 </button>
 )}
 </div>
 </div>
 )
}

export default function SettingsPage() {
 return (
 <Suspense fallback={<div className="max-w-xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}</div>}>
 <SettingsContent />
 </Suspense>
 )
}
