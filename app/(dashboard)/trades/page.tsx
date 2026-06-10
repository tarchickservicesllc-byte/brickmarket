'use client'

import { useEffect, useRef, useState } from 'react'
import SetSearch from '@/components/shared/SetSearch'
import { createClient } from '@/lib/supabase/client'
import type { LegoSet } from '@/types/database'
import { toast } from 'sonner'
import {
  RefreshCw, Plus, X, CheckCircle, XCircle, Clock, Filter,
  ArrowUpRight, Image as ImageIcon, Send, MessageSquare,
  TrendingUp, Users, Search, ShieldCheck, AlertTriangle,
  Star, Flag, Camera, Truck, PackageCheck, BadgeCheck,
  TriangleAlert, Info,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TradeSet extends LegoSet { condition: 'new' | 'used'; value?: number }

interface PartnerProfile {
  username: string
  avatar_url: string | null
  trade_count: number
  trade_rating_avg: number | null
  email_verified: boolean
}

interface TradeMatch {
  id: string
  match_score: number
  status: string
  user_a_accepted: boolean
  user_b_accepted: boolean
  user_a_id: string
  user_b_id: string
  // Trust & safety workflow
  user_a_photo_url: string | null
  user_b_photo_url: string | null
  user_a_trade_terms_accepted: boolean
  user_b_trade_terms_accepted: boolean
  user_a_ship_agreed: boolean
  user_b_ship_agreed: boolean
  user_a_tracking: string | null
  user_b_tracking: string | null
  completed_at: string | null
  dispute_filed: boolean
  offer_a: { have_set_ids: number[]; want_set_ids: number[]; notes: string | null; user: PartnerProfile } | null
  offer_b: { have_set_ids: number[]; want_set_ids: number[]; notes: string | null; user: PartnerProfile } | null
}

interface RecentTrade {
  id: string
  match_score: number
  created_at: string
  offer_a: { have_set_ids: number[]; want_set_ids: number[]; user: { username: string } } | null
  offer_b: { have_set_ids: number[]; want_set_ids: number[]; user: { username: string } } | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-900/40 text-amber-400 border-amber-700',       icon: Clock },
  accepted:  { label: 'Accepted',  color: 'bg-blue-900/40 text-blue-400 border-blue-700',           icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-700',  icon: PackageCheck },
  disputed:  { label: 'Disputed',  color: 'bg-red-900/40 text-red-400 border-red-700',              icon: Flag },
  declined:  { label: 'Declined',  color: 'bg-slate-700/60 text-slate-400 border-slate-600',        icon: XCircle },
}

const scoreColor = (s: number) =>
  s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s >= 40 ? 'bg-amber-500' : 'bg-slate-500'

// ─── Small UI pieces ─────────────────────────────────────────────────────────

function SetChip({ s, onRemove }: { s: TradeSet; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl">
      {s.image_url && <img src={s.image_url} alt={s.name} className="w-8 h-8 object-contain flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-100 truncate">{s.name}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>#{s.set_number}</span>
          <span className={`px-1.5 py-0.5 rounded font-medium ${s.condition === 'new' ? 'bg-blue-900/50 text-blue-300' : 'bg-amber-900/50 text-amber-300'}`}>
            {s.condition === 'new' ? 'New/Sealed' : 'Used/Open'}
          </span>
          {s.value && <span className="text-emerald-400 font-semibold">{formatCurrency(s.value)}</span>}
        </div>
      </div>
      <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-900/30 hover:text-red-400 text-slate-500 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 ${(hover || value) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
        </button>
      ))}
    </div>
  )
}

function PartnerBadges({ profile }: { profile: PartnerProfile }) {
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      {profile.email_verified && (
        <span className="flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full font-semibold">
          <BadgeCheck className="w-3 h-3" /> Verified
        </span>
      )}
      {profile.trade_count > 0 ? (
        <span className="flex items-center gap-1 bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-semibold">
          <PackageCheck className="w-3 h-3" /> {profile.trade_count} trade{profile.trade_count !== 1 ? 's' : ''}
        </span>
      ) : (
        <span className="flex items-center gap-1 bg-amber-900/40 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded-full font-semibold">
          <TriangleAlert className="w-3 h-3" /> New trader
        </span>
      )}
      {profile.trade_rating_avg !== null && (
        <span className="flex items-center gap-1 bg-slate-700/60 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-full font-semibold">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {profile.trade_rating_avg.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// ─── Trade Chat ───────────────────────────────────────────────────────────────

function TradeChat({ matchId, currentUserId }: { matchId: string; currentUserId: string | null }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<{ id: string; sender_id: string; body: string; created_at: string }[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('trade_messages')
        .select('id, sender_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
    }
    load()

    const channel = supabase
      .channel(`trade_chat_${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'trade_messages', filter: `match_id=eq.${matchId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as { id: string; sender_id: string; body: string; created_at: string }])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!text.trim() || !currentUserId) return
    setSending(true)
    const { error } = await supabase.from('trade_messages').insert({ match_id: matchId, sender_id: currentUserId, body: text.trim() })
    setSending(false)
    if (error) { toast.error('Could not send message'); return }
    setText('')
  }

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700">
        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-300">Trade chat</span>
      </div>
      <div className="max-h-36 overflow-y-auto p-3 space-y-2 bg-slate-950">
        {messages.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No messages yet.</p>}
        {messages.map(m => {
          const isMe = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>{m.body}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-2 border-t border-slate-700 bg-slate-800">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Message…"
          className="flex-1 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <button onClick={send} disabled={sending || !text.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function TradeTermsModal({ onAccept, onCancel, title = 'Trade Terms & Disclaimer' }: { onAccept: () => void; onCancel: () => void; title?: string }) {
  const [c1, setC1] = useState(false)
  const [c2, setC2] = useState(false)
  const [c3, setC3] = useState(false)
  const allChecked = c1 && c2 && c3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">{title}</h2>
            <p className="text-xs text-slate-400">You must agree before proceeding</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 text-sm text-slate-300 space-y-2 max-h-40 overflow-y-auto">
          <p><strong className="text-slate-100">BrickMarket is not a party to any trade.</strong> We act only as a discovery platform and are not responsible for trade outcomes, item condition, fraud, or disputes.</p>
          <p><strong className="text-slate-100">Trades are between users only.</strong> Always use a tracked shipping method and take photos before sending. BrickMarket has no ability to recover items or funds.</p>
          <p><strong className="text-slate-100">Set values are estimates only</strong> based on third-party data (BrickLink, eBay) and may be inaccurate.</p>
        </div>
        <div className="space-y-3 mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={c1} onChange={e => setC1(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0" />
            <span className="text-sm text-slate-300">My items are accurately described and in the condition stated. I take full responsibility for misrepresentation.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={c2} onChange={e => setC2(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0" />
            <span className="text-sm text-slate-300">I understand BrickMarket is <strong className="text-slate-100">not responsible</strong> for any trade outcome, including fraud, loss, or disputes.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={c3} onChange={e => setC3(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0" />
            <span className="text-sm text-slate-300">I agree to BrickMarket&apos;s <a href="/terms" target="_blank" className="text-blue-400 underline">Terms of Service</a> and trade at my own risk.</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
          <button onClick={onAccept} disabled={!allChecked} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
            I Agree — Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewModal({ matchId, theirUsername, onClose }: { matchId: string; theirUsername: string; onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (rating === 0) { toast.error('Select a star rating'); return }
    setSubmitting(true)
    const res = await fetch('/api/trades/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, rating, body }),
    })
    setSubmitting(false)
    if (!res.ok) { toast.error((await res.json()).error); return }
    toast.success('Review submitted!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="font-bold text-slate-100 text-lg mb-1">Rate your trade with @{theirUsername}</h2>
        <p className="text-sm text-slate-400 mb-5">Your honest review helps the community trade safely.</p>
        <div className="flex justify-center mb-4">
          <StarRating value={rating} onChange={setRating} />
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-slate-400 mb-4 -mt-2">
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Okay' : rating === 2 ? 'Poor' : 'Terrible'}
          </p>
        )}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          placeholder="Describe your experience (optional)…"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">Skip</button>
          <button onClick={submit} disabled={submitting || rating === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DisputeModal({ matchId, theirUsername, onClose, onDisputed }: { matchId: string; theirUsername: string; onClose: () => void; onDisputed: () => void }) {
  const REASONS = ['Item not as described', 'Item not received', 'Partner stopped responding', 'Tracking number invalid', 'Wrong item sent', 'Other']
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!reason || !description.trim()) { toast.error('Select a reason and describe the issue'); return }
    setSubmitting(true)
    const res = await fetch('/api/trades/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, reason, description }),
    })
    setSubmitting(false)
    if (!res.ok) { toast.error((await res.json()).error); return }
    toast.success('Dispute filed. Our team will review within 24-48 hours.')
    onDisputed()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <Flag className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg">File a Dispute</h2>
            <p className="text-xs text-slate-400">Against @{theirUsername} — we&apos;ll review within 24–48 hours</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Reason</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-colors ${reason === r ? 'border-red-500 bg-red-950/40 text-red-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Describe what happened</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Be as specific as possible — include dates, amounts, and what was agreed…"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
          </div>
        </div>
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2 text-xs text-amber-300 mb-4">
          Filing a false dispute may result in account suspension. Only file if you have a genuine issue.
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-600 text-slate-300 hover:bg-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={submitting || !reason || !description.trim()} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
            {submitting ? 'Filing…' : 'File Dispute'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Trade Workflow ───────────────────────────────────────────────────────────

function TradeWorkflow({
  match, isUserA, currentUserId, theirUsername, partnerTradeCount, onRefresh, myReviews,
}: {
  match: TradeMatch
  isUserA: boolean
  currentUserId: string | null
  theirUsername: string
  partnerTradeCount: number
  onRefresh: () => void
  myReviews: string[]
}) {
  const supabase = createClient()
  const [showPerTradeTerms, setShowPerTradeTerms] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [trackingInput, setTrackingInput] = useState('')
  const [showTrackingInput, setShowTrackingInput] = useState(false)
  const [working, setWorking] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const myTermsAccepted = isUserA ? match.user_a_trade_terms_accepted : match.user_b_trade_terms_accepted
  const theirTermsAccepted = isUserA ? match.user_b_trade_terms_accepted : match.user_a_trade_terms_accepted
  const myPhoto = isUserA ? match.user_a_photo_url : match.user_b_photo_url
  const theirPhoto = isUserA ? match.user_b_photo_url : match.user_a_photo_url
  const myShipAgreed = isUserA ? match.user_a_ship_agreed : match.user_b_ship_agreed
  const theirShipAgreed = isUserA ? match.user_b_ship_agreed : match.user_a_ship_agreed
  const myTracking = isUserA ? match.user_a_tracking : match.user_b_tracking
  const theirTracking = isUserA ? match.user_b_tracking : match.user_a_tracking

  const bothTerms = match.user_a_trade_terms_accepted && match.user_b_trade_terms_accepted
  const bothPhotos = !!(match.user_a_photo_url && match.user_b_photo_url)
  const bothShipAgreed = match.user_a_ship_agreed && match.user_b_ship_agreed
  const bothTracking = !!(match.user_a_tracking && match.user_b_tracking)
  const isCompleted = match.status === 'completed'
  const isDisputed = match.status === 'disputed'
  const alreadyReviewed = myReviews.includes(match.id)

  const doAction = async (action: string, extra?: Record<string, string>) => {
    setWorking(true)
    const res = await fetch('/api/trades/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: match.id, action, ...extra }),
    })
    setWorking(false)
    if (!res.ok) { toast.error((await res.json()).error ?? 'Something went wrong'); return false }
    onRefresh()
    return true
  }

  const handlePhotoUpload = async (file: File) => {
    if (!currentUserId) return
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `trade-matches/${match.id}/${currentUserId}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('trade-photos').upload(path, file, { upsert: true })
    if (uploadErr) { toast.error('Upload failed'); setUploadingPhoto(false); return }
    const { data: { publicUrl } } = supabase.storage.from('trade-photos').getPublicUrl(path)
    await doAction('upload_photo', { photo_url: publicUrl })
    setUploadingPhoto(false)
  }

  // ── Step indicator ──────────────────────────────────────────────────────────
  const steps = [
    { label: 'Terms', done: bothTerms },
    { label: 'Photos', done: bothPhotos },
    { label: 'Ship agreement', done: bothShipAgreed },
    { label: 'Tracking', done: bothTracking },
    { label: 'Complete', done: isCompleted },
  ]

  return (
    <div className="space-y-3">
      {/* Progress stepper */}
      {!isCompleted && !isDisputed && (
        <div className="flex items-center gap-1 mb-1">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1 flex-1">
              <div className={`w-full h-1 rounded-full transition-colors ${s.done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              {i < steps.length - 1 && <div className="w-1 h-1 rounded-full bg-slate-700 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* 0-trade warning */}
      {partnerTradeCount === 0 && !isCompleted && (
        <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-800/50 rounded-xl px-3 py-2.5">
          <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300"><strong>Heads up:</strong> @{theirUsername} has 0 completed trades. Use extra caution — always ship with tracking and insurance.</p>
        </div>
      )}

      {/* STEP 1: Per-trade terms */}
      {!isCompleted && !isDisputed && (
        <div className={`rounded-xl border p-3 ${bothTerms ? 'border-emerald-800/40 bg-emerald-950/20' : 'border-slate-700 bg-slate-900/40'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${bothTerms ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>1</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Accept trade terms</div>
                <div className="text-xs text-slate-500">
                  {bothTerms ? 'Both accepted ✓' : myTermsAccepted ? `Waiting for @${theirUsername}…` : theirTermsAccepted ? '@' + theirUsername + ' accepted — your turn' : 'Both users must accept'}
                </div>
              </div>
            </div>
            {!myTermsAccepted && (
              <button onClick={() => setShowPerTradeTerms(true)} className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                Accept
              </button>
            )}
            {myTermsAccepted && !bothTerms && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {bothTerms && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          </div>
        </div>
      )}

      {/* STEP 2: Photo upload (unlocks after terms) */}
      {!isCompleted && !isDisputed && (
        <div className={`rounded-xl border p-3 ${bothPhotos ? 'border-emerald-800/40 bg-emerald-950/20' : bothTerms ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-slate-900/20 opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${bothPhotos ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>2</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Upload item photos</div>
                <div className="text-xs text-slate-500">Both must upload a clear photo of the items for this trade</div>
              </div>
            </div>
            {bothPhotos && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* My photo */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Your photo</div>
              {myPhoto ? (
                <img src={myPhoto} alt="Your items" className="w-full h-20 object-cover rounded-lg border border-slate-700" />
              ) : (
                <>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
                  <button onClick={() => photoRef.current?.click()} disabled={uploadingPhoto || !bothTerms}
                    className="w-full h-20 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-blue-950/20 transition-colors text-slate-500 hover:text-blue-400 disabled:opacity-40">
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">{uploadingPhoto ? 'Uploading…' : 'Add photo'}</span>
                  </button>
                </>
              )}
            </div>
            {/* Their photo */}
            <div>
              <div className="text-xs text-slate-500 mb-1">@{theirUsername}&apos;s photo</div>
              {theirPhoto ? (
                <img src={theirPhoto} alt="Their items" className="w-full h-20 object-cover rounded-lg border border-slate-700" />
              ) : (
                <div className="w-full h-20 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-600">
                  <Clock className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Simultaneous ship agreement (unlocks after both photos) */}
      {!isCompleted && !isDisputed && (
        <div className={`rounded-xl border p-3 ${bothShipAgreed ? 'border-emerald-800/40 bg-emerald-950/20' : bothPhotos ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-slate-900/20 opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${bothShipAgreed ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>3</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Agree to ship simultaneously</div>
                <div className="text-xs text-slate-500">
                  {bothShipAgreed ? 'Both agreed — submit tracking below ✓'
                    : myShipAgreed ? `Waiting for @${theirUsername}…`
                    : theirShipAgreed ? `@${theirUsername} agreed — your turn`
                    : 'Both must agree before either ships'}
                </div>
              </div>
            </div>
            {!myShipAgreed && (
              <button onClick={() => doAction('agree_ship')} disabled={working || !bothPhotos}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                I Agree
              </button>
            )}
            {myShipAgreed && !bothShipAgreed && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {bothShipAgreed && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          </div>
          {!myShipAgreed && bothPhotos && (
            <div className="mt-2 text-xs text-slate-500 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Both parties ship at the same time — once both have submitted tracking numbers below.
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Tracking number (unlocks after ship agreement) */}
      {!isCompleted && !isDisputed && (
        <div className={`rounded-xl border p-3 ${(myTracking && theirTracking) ? 'border-emerald-800/40 bg-emerald-950/20' : bothShipAgreed ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-slate-900/20 opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${(myTracking && theirTracking) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>4</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Submit tracking numbers</div>
                <div className="text-xs text-slate-500">Required from both parties before trade is verified</div>
              </div>
            </div>
            {myTracking && theirTracking && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
          </div>
          <div className="space-y-2 mt-1">
            {myTracking ? (
              <div className="flex items-center gap-2 text-xs">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">Your tracking: </span>
                <span className="text-emerald-300 font-mono">{myTracking}</span>
              </div>
            ) : bothShipAgreed ? (
              showTrackingInput ? (
                <div className="flex gap-2">
                  <input
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number…"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      const ok = await doAction('submit_tracking', { tracking_number: trackingInput })
                      if (ok) setShowTrackingInput(false)
                    }}
                    disabled={working || !trackingInput.trim()}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowTrackingInput(true)} className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  <Truck className="w-3.5 h-3.5" /> Add your tracking number
                </button>
              )
            ) : null}
            {theirTracking ? (
              <div className="flex items-center gap-2 text-xs">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">@{theirUsername}&apos;s tracking: </span>
                <span className="text-emerald-300 font-mono">{theirTracking}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-600">@{theirUsername}&apos;s tracking: not submitted yet</div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: Mark complete (unlocks after both tracking) */}
      {!isCompleted && !isDisputed && (
        <div className={`rounded-xl border p-3 ${isCompleted ? 'border-emerald-800/40 bg-emerald-950/20' : bothTracking ? 'border-slate-700 bg-slate-900/40' : 'border-slate-800 bg-slate-900/20 opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-slate-700 text-slate-300">5</div>
              <div>
                <div className="text-sm font-semibold text-slate-200">Mark trade complete</div>
                <div className="text-xs text-slate-500">Confirm you received your items in the agreed condition</div>
              </div>
            </div>
            <button
              onClick={() => doAction('complete')}
              disabled={working || !bothTracking}
              className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Trade completed!</span>
          </div>
          {!alreadyReviewed && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Star className="w-3.5 h-3.5" /> Leave a review for @{theirUsername}
            </button>
          )}
          {alreadyReviewed && <p className="text-xs text-slate-500">You reviewed this trade.</p>}
        </div>
      )}

      {/* Disputed state */}
      {isDisputed && (
        <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 flex items-start gap-2">
          <Flag className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-300">Dispute filed</div>
            <div className="text-xs text-slate-400">Our team is reviewing this trade. We&apos;ll be in touch within 24–48 hours.</div>
          </div>
        </div>
      )}

      {/* Dispute button (available during active trade) */}
      {(match.status === 'accepted' || match.status === 'completed') && !isDisputed && (
        <button
          onClick={() => setShowDisputeModal(true)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          <Flag className="w-3 h-3" /> File a dispute
        </button>
      )}

      {/* Modals */}
      {showPerTradeTerms && (
        <TradeTermsModal
          title="Confirm trade terms"
          onAccept={async () => { setShowPerTradeTerms(false); await doAction('accept_trade_terms') }}
          onCancel={() => setShowPerTradeTerms(false)}
        />
      )}
      {showReviewModal && (
        <ReviewModal
          matchId={match.id}
          theirUsername={theirUsername}
          onClose={() => { setShowReviewModal(false); onRefresh() }}
        />
      )}
      {showDisputeModal && (
        <DisputeModal
          matchId={match.id}
          theirUsername={theirUsername}
          onClose={() => setShowDisputeModal(false)}
          onDisputed={onRefresh}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const supabase = createClient()
  const [haveSet, setHaveSet] = useState<LegoSet | null>(null)
  const [haveSets, setHaveSets] = useState<TradeSet[]>([])
  const [wantSets, setWantSets] = useState<TradeSet[]>([])
  const [haveCondition, setHaveCondition] = useState<'new' | 'used'>('used')
  const [haveValue, setHaveValue] = useState('')
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [matches, setMatches] = useState<TradeMatch[]>([])
  const [myReviews, setMyReviews] = useState<string[]>([])
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openChat, setOpenChat] = useState<string | null>(null)
  const [showPostTerms, setShowPostTerms] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMatches()
    loadRecentTrades()
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
  }, [])

  async function loadMatches() {
    const res = await fetch('/api/trades/match')
    const data = await res.json()
    setMatches(data.matches ?? [])
    setMyReviews(data.myReviews ?? [])
  }

  async function loadRecentTrades() {
    const { data } = await supabase
      .from('trade_matches')
      .select(`
        id, match_score, created_at,
        offer_a:trade_offers!trade_matches_offer_a_id_fkey(have_set_ids, want_set_ids, user:profiles(username)),
        offer_b:trade_offers!trade_matches_offer_b_id_fkey(have_set_ids, want_set_ids, user:profiles(username))
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6)
    setRecentTrades((data ?? []) as unknown as RecentTrade[])
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoFile) return null
    const ext = photoFile.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('trade-photos').upload(path, photoFile)
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('trade-photos').getPublicUrl(path)
    return publicUrl
  }

  function addHaveSet() {
    if (!haveSet || haveSets.find(s => s.id === haveSet.id)) return
    setHaveSets(p => [...p, { ...haveSet, condition: haveCondition, value: haveValue ? parseFloat(haveValue) : undefined }])
    setHaveSet(null)
    setHaveValue('')
  }

  async function submitOffer() {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const photoUrl = user ? await uploadPhoto(user.id) : null
    const notesPayload = JSON.stringify({ text: notes.trim() || null, photo_url: photoUrl })

    const res = await fetch('/api/trades/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        have_set_ids: haveSets.map(s => s.id),
        want_set_ids: wantSets.map(s => s.id),
        notes: notesPayload,
      }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      toast.error(data.error)
      if (data.upgrade) window.location.href = '/settings?upgrade=1'
      return
    }
    toast.success(`Posted! ${data.matches_found} match${data.matches_found !== 1 ? 'es' : ''} found.`)
    loadMatches()
    loadRecentTrades()
    setHaveSets([])
    setWantSets([])
    setNotes('')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function respondToMatch(matchId: string, action: 'accept' | 'decline') {
    const res = await fetch('/api/trades/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, action }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success(action === 'accept' ? 'Match accepted! Complete the safety steps below.' : 'Match declined.')
    loadMatches()
  }

  function parseOfferNotes(raw: string | null): { text: string | null; photo_url: string | null } {
    try { return JSON.parse(raw ?? '{}') } catch { return { text: raw, photo_url: null } }
  }

  const filteredMatches = matches
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .filter(m => {
      if (!searchQuery) return true
      const other = m.user_a_id === currentUserId ? m.offer_b?.user?.username : m.offer_a?.user?.username
      return other?.toLowerCase().includes(searchQuery.toLowerCase())
    })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {showPostTerms && (
        <TradeTermsModal
          onAccept={() => { setShowPostTerms(false); submitOffer() }}
          onCancel={() => setShowPostTerms(false)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Trade Matchmaker</h1>
        <p className="text-slate-400 text-sm mt-0.5">List sets you have and want. Get auto-matched with compatible traders.</p>
      </div>

      {/* Legal notice */}
      <div className="flex items-start gap-3 bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200 leading-relaxed">
          <strong className="text-amber-300">Disclaimer:</strong> BrickMarket is a discovery platform only. All trades are between users. BrickMarket and Tarchick Services LLC are not responsible for trade outcomes, disputes, or item condition. Trade at your own risk.
        </p>
      </div>

      {/* Recent completed trades */}
      {recentTrades.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-300">Recent Completed Trades</h2>
            <div className="flex-1 h-px bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {recentTrades.map(t => {
              const userA = (t.offer_a?.user as { username: string } | null)?.username
              const userB = (t.offer_b?.user as { username: string } | null)?.username
              return (
                <div key={t.id} className="bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-300 truncate">@{userA} ↔ @{userB}</span>
                  </div>
                  <div className="text-xs text-slate-500">{t.match_score}% match</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create offer */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="font-bold text-slate-100 mb-4">Post a new trade offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-emerald-900/50 rounded-full flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">H</span>
              </div>
              <h3 className="font-semibold text-white">I have to trade</h3>
            </div>
            <div className="space-y-2 mb-3">
              <SetSearch onSelect={s => setHaveSet(s)} placeholder="Search for a set…" />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex rounded-xl border border-slate-700 overflow-hidden text-sm">
                  {(['used', 'new'] as const).map(c => (
                    <button key={c} onClick={() => setHaveCondition(c)} className={`flex-1 py-2 font-semibold transition-colors ${haveCondition === c ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                      {c === 'new' ? 'New' : 'Used'}
                    </button>
                  ))}
                </div>
                <input type="number" value={haveValue} onChange={e => setHaveValue(e.target.value)} placeholder="Your value ($)" className="px-3 py-2 bg-slate-900 border border-slate-600 text-white placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <button onClick={addHaveSet} disabled={!haveSet} className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add set
              </button>
            </div>
            <div className="space-y-2">
              {haveSets.map(s => <SetChip key={s.id} s={s} onRemove={() => setHaveSets(p => p.filter(x => x.id !== s.id))} />)}
              {haveSets.length === 0 && <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-600 rounded-xl">No sets added yet</p>}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-900/50 rounded-full flex items-center justify-center">
                <span className="text-blue-400 text-xs font-bold">W</span>
              </div>
              <h3 className="font-semibold text-white">I want</h3>
            </div>
            <div className="space-y-2 mb-3">
              <SetSearch onSelect={s => { if (!wantSets.find(x => x.id === s.id)) setWantSets(p => [...p, { ...s, condition: 'used' }]) }} placeholder="Search for a set you want…" />
            </div>
            <div className="space-y-2">
              {wantSets.map(s => <SetChip key={s.id} s={s} onRemove={() => setWantSets(p => p.filter(x => x.id !== s.id))} />)}
              {wantSets.length === 0 && <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-600 rounded-xl">No sets added yet</p>}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Condition details, ratios, location…" className="w-full px-3 py-2 bg-slate-900 border border-slate-600 text-white placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Photo of your sets (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)) } }} />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-24 object-cover rounded-xl border border-slate-700" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }} className="absolute top-1 right-1 bg-slate-800 rounded-full p-1 shadow text-slate-400 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-blue-950/20 transition-colors text-slate-500 hover:text-blue-400">
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-medium">Upload a photo</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-400">You&apos;ll receive an email when a match is found.</p>
          <button
            onClick={() => {
              if (haveSets.length === 0 || wantSets.length === 0) { toast.error('Add at least one set to both lists'); return }
              setShowPostTerms(true)
            }}
            disabled={submitting || haveSets.length === 0 || wantSets.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            {submitting ? 'Finding matches…' : 'Post trade offer'}
          </button>
        </div>
      </div>

      {/* Matches */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="font-bold text-slate-100 text-lg">My Matches ({matches.length})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by username…" className="text-xs outline-none w-28 bg-transparent text-white placeholder-slate-400" />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                {['all', 'pending', 'accepted', 'completed', 'disputed', 'declined'].map(f => (
                  <button key={f} onClick={() => setFilterStatus(f)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filterStatus === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
            <RefreshCw className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300">No matches yet</p>
            <p className="text-sm text-slate-500 mt-1">Post a trade offer above to start getting matched.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map(match => {
              const isUserA = match.user_a_id === currentUserId
              const theirOffer = isUserA ? match.offer_b : match.offer_a
              const theirUsername = theirOffer?.user?.username ?? 'Unknown'
              const partnerProfile = theirOffer?.user
              const iAccepted = isUserA ? match.user_a_accepted : match.user_b_accepted
              const statusCfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.declined
              const StatusIcon = statusCfg.icon
              const theirNotes = parseOfferNotes(theirOffer?.notes ?? null)
              const chatOpen = openChat === match.id
              const isActiveMatch = match.status === 'accepted' || match.status === 'completed' || match.status === 'disputed'

              return (
                <div key={match.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${scoreColor(match.match_score)}`}>
                        {match.match_score}%
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-100">@{theirUsername}</div>
                        {partnerProfile && <PartnerBadges profile={partnerProfile} />}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Their offer notes/photo */}
                  {theirNotes.photo_url && (
                    <img src={theirNotes.photo_url} alt="Their sets" className="w-full h-28 object-cover rounded-xl border border-slate-700 mb-3" />
                  )}
                  {theirNotes.text && (
                    <div className="bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-300 mb-3 border border-slate-700">
                      <span className="font-semibold text-slate-400">Their note: </span>{theirNotes.text}
                    </div>
                  )}

                  {/* Have/want counts */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-1">They have</div>
                      <div className="text-slate-200 font-semibold">{theirOffer?.have_set_ids?.length ?? 0} set{(theirOffer?.have_set_ids?.length ?? 0) !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">They want</div>
                      <div className="text-slate-200 font-semibold">{theirOffer?.want_set_ids?.length ?? 0} set{(theirOffer?.want_set_ids?.length ?? 0) !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Pending — accept/decline */}
                  {match.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {!iAccepted ? (
                        <>
                          <button onClick={() => respondToMatch(match.id, 'accept')} className="flex items-center gap-1.5 flex-1 justify-center bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded-xl text-sm transition-colors">
                            <CheckCircle className="w-4 h-4" /> Accept
                          </button>
                          <button onClick={() => respondToMatch(match.id, 'decline')} className="flex items-center gap-1.5 flex-1 justify-center border border-slate-600 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-sm transition-colors">
                            <XCircle className="w-4 h-4" /> Decline
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-amber-400 font-medium flex items-center gap-2 bg-amber-950/40 border border-amber-800/40 px-3 py-2 rounded-xl w-full">
                          <Clock className="w-4 h-4" /> Waiting for @{theirUsername} to accept…
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active match workflow */}
                  {isActiveMatch && (
                    <div className="space-y-3">
                      <TradeWorkflow
                        match={match}
                        isUserA={isUserA}
                        currentUserId={currentUserId}
                        theirUsername={theirUsername}
                        partnerTradeCount={partnerProfile?.trade_count ?? 0}
                        onRefresh={loadMatches}
                        myReviews={myReviews}
                      />

                      {/* Chat toggle (only for accepted/completed) */}
                      {(match.status === 'accepted' || match.status === 'completed') && (
                        <>
                          <button
                            onClick={() => setOpenChat(chatOpen ? null : match.id)}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/30 hover:bg-blue-950/50 border border-blue-800/40 px-3 py-2 rounded-xl transition-colors w-full justify-center"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {chatOpen ? 'Close chat' : 'Open trade chat'}
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          {chatOpen && <TradeChat matchId={match.id} currentUserId={currentUserId} />}
                        </>
                      )}
                    </div>
                  )}

                  {/* Declined */}
                  {match.status === 'declined' && (
                    <div className="text-sm text-slate-500 flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl">
                      <XCircle className="w-4 h-4" /> This trade was declined.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center pb-4">
        Trade Matchmaker is for community use. Set values are estimates only. BrickMarket is not a party to any trade.{' '}
        <a href="/terms" className="underline hover:text-slate-400">Terms of Service</a>
      </p>
    </div>
  )
}
