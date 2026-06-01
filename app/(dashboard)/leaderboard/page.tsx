'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getWeekNumber } from '@/lib/utils'
import SetSearch from '@/components/shared/SetSearch'
import type { LegoSet } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

interface FlipEntry {
 id: string
 bought_price: number
 sold_price: number
 roi_percent: number
 profit_dollars: number
 bought_at: string | null
 sold_at: string | null
 notes: string | null
 found_where: string | null
 proof_image_url: string | null
 upvotes: number
 week_number: number | null
 year: number | null
 user: { username: string; avatar_url: string | null } | null
 lego_set: { name: string; set_number: string; image_url: string | null } | null
}

type Tab = 'weekly' | 'alltime' | 'submit'

export default function LeaderboardPage() {
 const supabase = createClient()
 const [tab, setTab] = useState<Tab>('weekly')
 const [entries, setEntries] = useState<FlipEntry[]>([])
 const [loading, setLoading] = useState(true)
 const [currentUserId, setCurrentUserId] = useState<string | null>(null)

 // Submit form
 const [selectedSet, setSelectedSet] = useState<LegoSet | null>(null)
 const [proofFile, setProofFile] = useState<File | null>(null)
 const [proofPreview, setProofPreview] = useState<string | null>(null)
 const [form, setForm] = useState({ bought_price: '', sold_price: '', bought_at: '', sold_at: '', found_where: 'facebook_marketplace', notes: '' })
 const [submitting, setSubmitting] = useState(false)

 const { getRootProps, getInputProps } = useDropzone({
 accept: { 'image/*': [] }, maxFiles: 1,
 onDrop: files => {
 setProofFile(files[0])
 setProofPreview(URL.createObjectURL(files[0]))
 },
 })

 useEffect(() => {
 supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
 loadEntries()
 }, [tab])

 async function loadEntries() {
 setLoading(true)
 const now = new Date()
 let query = supabase
 .from('flip_entries')
 .select('*, user:profiles(username, avatar_url), lego_set:lego_sets(name, set_number, image_url)')
 .order('roi_percent', { ascending: false })
 .limit(tab === 'alltime' ? 50 : 10)

 if (tab === 'weekly') {
 query = query.eq('week_number', getWeekNumber(now)).eq('year', now.getFullYear())
 }

 const { data } = await query
 setEntries((data ?? []) as unknown as FlipEntry[])
 setLoading(false)
 }

 async function upvote(entryId: string) {
 if (!currentUserId) { toast.error('Sign in to upvote'); return }
 const res = await fetch('/api/leaderboard/upvote', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ flip_entry_id: entryId }),
 })
 if (res.status === 409) { toast.error('Already upvoted!'); return }
 if (!res.ok) { toast.error('Could not upvote'); return }
 toast.success('Upvoted!')
 loadEntries()
 }

 async function submitFlip() {
 if (!selectedSet || !form.bought_price || !form.sold_price) { toast.error('Fill in required fields'); return }
 setSubmitting(true)
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return

 let proofUrl: string | null = null
 if (proofFile) {
 const ext = proofFile.name.split('.').pop()
 const path = `${user.id}/flip-${Date.now()}.${ext}`
 const { error } = await supabase.storage.from('listing-images').upload(path, proofFile)
 if (!error) {
 const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
 proofUrl = publicUrl
 }
 }

 const now = new Date()
 const { error } = await supabase.from('flip_entries').insert({
 user_id: user.id,
 set_id: selectedSet.id,
 bought_price: parseFloat(form.bought_price),
 sold_price: parseFloat(form.sold_price),
 bought_at: form.bought_at || null,
 sold_at: form.sold_at || null,
 found_where: form.found_where || null,
 notes: form.notes || null,
 proof_image_url: proofUrl,
 week_number: getWeekNumber(now),
 year: now.getFullYear(),
 })
 setSubmitting(false)
 if (error) { toast.error(error.message); return }
 toast.success('Flip submitted! ')
 setForm({ bought_price: '', sold_price: '', bought_at: '', sold_at: '', found_where: 'facebook_marketplace', notes: '' })
 setSelectedSet(null)
 setProofFile(null)
 setProofPreview(null)
 setTab('weekly')
 }

 const TABS: { id: Tab; label: string }[] = [
 { id: 'weekly', label: ' This Week' },
 { id: 'alltime', label: ' All Time' },
 { id: 'submit', label: '+ Submit a Flip' },
 ]

 return (
 <div className="space-y-5">
 <div>
 <h1 className="text-2xl font-bold">Flip Leaderboard</h1>
 <p className="text-gray-500 text-sm">Top ROI flips from the BrickMarket community.</p>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
 {TABS.map(t => (
 <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white shadow-sm text-text-main' : 'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
 ))}
 </div>

 {/* Leaderboard */}
 {tab !== 'submit' && (
 loading ? (
 <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
 ) : entries.length === 0 ? (
 <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
 <div className="text-4xl mb-2"></div>
 <p>No flips this week yet. Be the first!</p>
 <button onClick={() => setTab('submit')} className="mt-3 text-brick font-medium text-sm hover:underline">Submit a flip →</button>
 </div>
 ) : (
 <div className="space-y-3">
 {entries.map((entry, i) => (
 <div key={entry.id} className={`bg-white rounded-2xl border p-4 ${i === 0 ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
 <div className="flex items-center gap-4">
 <div className={`text-2xl font-black w-10 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-200'}`}>
 #{i + 1}
 </div>
 {entry.lego_set?.image_url && (
 <Image src={entry.lego_set.image_url} alt={entry.lego_set.name} width={52} height={52} className="w-13 h-13 rounded-xl object-contain bg-surface" />
 )}
 <div className="flex-1 min-w-0">
 <div className="font-semibold truncate">{entry.lego_set?.name ?? 'Unknown Set'}</div>
 <div className="text-xs text-gray-400">@{entry.user?.username} · {entry.found_where?.replace(/_/g, ' ')}</div>
 {entry.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.notes}</p>}
 </div>
 <div className="text-right flex-shrink-0">
 <div className="text-green-600 font-black text-xl">+{entry.roi_percent?.toFixed(0)}%</div>
 <div className="text-xs text-gray-400">{formatCurrency(entry.bought_price)} → {formatCurrency(entry.sold_price)}</div>
 <div className="text-xs font-semibold text-green-600">+{formatCurrency(entry.profit_dollars)}</div>
 </div>
 </div>
 <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
 <button onClick={() => upvote(entry.id)} className="text-xs text-gray-400 hover:text-brick transition-colors flex items-center gap-1">
 {entry.upvotes} upvote{entry.upvotes !== 1 ? 's' : ''}
 </button>
 {entry.week_number && (
 <span className="text-xs text-gray-300">Week {entry.week_number}, {entry.year}</span>
 )}
 </div>
 </div>
 ))}
 </div>
 )
 )}

 {/* Submit form */}
 {tab === 'submit' && (
 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 max-w-lg">
 <h2 className="font-bold">Log a Completed Flip</h2>

 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">LEGO Set *</label>
 <SetSearch onSelect={setSelectedSet} />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Bought for ($) *</label>
 <input type="number" step="0.01" value={form.bought_price} onChange={e => setForm(f => ({ ...f, bought_price: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Sold for ($) *</label>
 <input type="number" step="0.01" value={form.sold_price} onChange={e => setForm(f => ({ ...f, sold_price: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Date Bought</label>
 <input type="date" value={form.bought_at} onChange={e => setForm(f => ({ ...f, bought_at: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
 </div>
 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Date Sold</label>
 <input type="date" value={form.sold_at} onChange={e => setForm(f => ({ ...f, sold_at: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
 </div>
 </div>

 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Where did you find it?</label>
 <select value={form.found_where} onChange={e => setForm(f => ({ ...f, found_where: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
 {['facebook_marketplace','craigslist','garage_sale','thrift_store','retail','offerup','ebay','other'].map(v => (
 <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Your story / notes</label>
 <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm resize-none" placeholder="How did you find it? Tips for others?" />
 </div>

 <div>
 <label className="block text-xs font-medium text-gray-600 mb-1">Proof photo (optional)</label>
 <div {...getRootProps()} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-300 transition-colors">
 <input {...getInputProps()} />
 {proofPreview ? (
 <Image src={proofPreview} alt="proof" width={120} height={80} className="mx-auto rounded-lg object-cover h-20" />
 ) : (
 <p className="text-xs text-gray-400">Drop receipt or photo here</p>
 )}
 </div>
 </div>

 <button onClick={submitFlip} disabled={submitting} className="w-full bg-brick hover:bg-brick-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
 {submitting ? 'Submitting…' : ' Submit to Leaderboard'}
 </button>
 </div>
 )}
 </div>
 )
}
