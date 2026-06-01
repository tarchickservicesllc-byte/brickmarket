'use client'

import { useEffect, useState } from 'react'
import SetSearch from '@/components/shared/SetSearch'
import type { LegoSet } from '@/types/database'
import { toast } from 'sonner'

interface TradeMatch {
  id: string
  match_score: number
  status: string
  user_a_accepted: boolean
  user_b_accepted: boolean
  user_a_id: string
  user_b_id: string
  offer_a: { have_set_ids: number[]; want_set_ids: number[]; user: { username: string; avatar_url: string | null } } | null
  offer_b: { have_set_ids: number[]; want_set_ids: number[]; user: { username: string; avatar_url: string | null } } | null
}

export default function TradesPage() {
  const [haveSet, setHaveSet] = useState<LegoSet | null>(null)
  const [wantSet, setWantSet] = useState<LegoSet | null>(null)
  const [haveSets, setHaveSets] = useState<LegoSet[]>([])
  const [wantSets, setWantSets] = useState<LegoSet[]>([])
  const [matches, setMatches] = useState<TradeMatch[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    loadMatches()
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null))
    })
  }, [])

  async function loadMatches() {
    const res = await fetch('/api/trades/match')
    const data = await res.json()
    setMatches(data.matches ?? [])
  }

  async function submitOffer() {
    if (haveSets.length === 0 || wantSets.length === 0) {
      toast.error('Add at least one set to both lists')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/trades/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ have_set_ids: haveSets.map(s => s.id), want_set_ids: wantSets.map(s => s.id) }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      toast.error(data.error)
      if (data.upgrade) window.location.href = '/settings?upgrade=1'
      return
    }
    toast.success(`Trade offer posted! ${data.matches_found} match${data.matches_found !== 1 ? 'es' : ''} found.`)
    loadMatches()
    setHaveSets([])
    setWantSets([])
  }

  async function respondToMatch(matchId: string, action: 'accept' | 'decline') {
    const res = await fetch('/api/trades/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: matchId, action }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success(action === 'accept' ? 'Match accepted!' : 'Match declined')
    loadMatches()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trade Matchmaker</h1>
        <p className="text-gray-500 text-sm">List sets you have and want. We&apos;ll find compatible trade partners.</p>
      </div>

      {/* Create offer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold mb-3">📦 I have to trade</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <SetSearch onSelect={s => { setHaveSet(s); }} placeholder="Add a set you have…" />
            </div>
            <button
              onClick={() => { if (haveSet && !haveSets.find(s => s.id === haveSet.id)) { setHaveSets(p => [...p, haveSet]); setHaveSet(null) } }}
              disabled={!haveSet}
              className="px-3 py-2 bg-brick text-white rounded-lg text-sm font-semibold disabled:opacity-40"
            >Add</button>
          </div>
          <div className="mt-3 space-y-1.5">
            {haveSets.map(s => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg text-sm">
                <span>{s.name} <span className="text-gray-400">#{s.set_number}</span></span>
                <button onClick={() => setHaveSets(p => p.filter(x => x.id !== s.id))} className="text-gray-300 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold mb-3">🎯 I want</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <SetSearch onSelect={s => { setWantSet(s) }} placeholder="Add a set you want…" />
            </div>
            <button
              onClick={() => { if (wantSet && !wantSets.find(s => s.id === wantSet.id)) { setWantSets(p => [...p, wantSet]); setWantSet(null) } }}
              disabled={!wantSet}
              className="px-3 py-2 bg-brick text-white rounded-lg text-sm font-semibold disabled:opacity-40"
            >Add</button>
          </div>
          <div className="mt-3 space-y-1.5">
            {wantSets.map(s => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg text-sm">
                <span>{s.name} <span className="text-gray-400">#{s.set_number}</span></span>
                <button onClick={() => setWantSets(p => p.filter(x => x.id !== s.id))} className="text-gray-300 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={submitOffer} disabled={submitting} className="bg-brick hover:bg-brick-dark text-white font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-60">
        {submitting ? 'Finding matches…' : '🔍 Find Trade Matches'}
      </button>

      {/* Matches */}
      <div>
        <h2 className="font-bold text-lg mb-3">My Matches</h2>
        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">🔄</div>
            <p>No matches yet. Post a trade offer to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => {
              const isUserA = match.user_a_id === currentUserId
              const myOffer = isUserA ? match.offer_a : match.offer_b
              const theirOffer = isUserA ? match.offer_b : match.offer_a
              const theirUsername = isUserA ? match.offer_b?.user?.username : match.offer_a?.user?.username
              const iAccepted = isUserA ? match.user_a_accepted : match.user_b_accepted

              return (
                <div key={match.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold">@{theirUsername}</span>
                      <span className="ml-2 text-xs bg-brick/10 text-brick font-semibold px-2 py-0.5 rounded-full">{match.match_score}% match</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      match.status === 'accepted' ? 'bg-green-50 text-green-600' :
                      match.status === 'declined' ? 'bg-red-50 text-red-500' :
                      'bg-yellow-50 text-yellow-600'
                    }`}>{match.status}</span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">They have:</span> {theirOffer?.have_set_ids?.length ?? 0} sets ·
                    <span className="font-medium ml-2">They want:</span> {theirOffer?.want_set_ids?.length ?? 0} sets
                  </div>

                  {match.status === 'pending' && !iAccepted && (
                    <div className="flex gap-2">
                      <button onClick={() => respondToMatch(match.id, 'accept')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors">Accept</button>
                      <button onClick={() => respondToMatch(match.id, 'decline')} className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2 rounded-lg text-sm transition-colors">Decline</button>
                    </div>
                  )}
                  {iAccepted && match.status === 'pending' && (
                    <div className="text-sm text-gray-400">Waiting for them to accept…</div>
                  )}
                  {match.status === 'accepted' && (
                    <div className="text-sm text-green-600 font-medium">✓ Both accepted — reach out to arrange the trade!</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
