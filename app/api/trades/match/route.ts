import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, toCents } from '@/lib/stripe'

type WorkflowAction =
  | 'accept'
  | 'decline'
  | 'accept_trade_terms'
  | 'upload_photo'
  | 'agree_ship'
  | 'submit_tracking'
  | 'complete'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  type MatchRow = import('@/types/database').Database['public']['Tables']['trade_matches']['Row'] & {
    offer_a: { have_set_ids: number[]; want_set_ids: number[]; notes: string | null; user: { username: string; avatar_url: string | null; trade_count: number; trade_rating_avg: number | null; email_verified: boolean } | null } | null
    offer_b: { have_set_ids: number[]; want_set_ids: number[]; notes: string | null; user: { username: string; avatar_url: string | null; trade_count: number; trade_rating_avg: number | null; email_verified: boolean } | null } | null
  }
  const { data: matches } = await supabase
    .from('trade_matches')
    .select(`
      *,
      offer_a:trade_offers!trade_matches_offer_a_id_fkey(*, user:profiles(username, avatar_url, trade_count, trade_rating_avg, email_verified)),
      offer_b:trade_offers!trade_matches_offer_b_id_fkey(*, user:profiles(username, avatar_url, trade_count, trade_rating_avg, email_verified))
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false }) as unknown as { data: MatchRow[] | null }

  // Check if current user has submitted a review for each match
  const matchIds = (matches ?? []).filter(m => m.status === 'completed').map(m => m.id)
  let myReviews: string[] = []
  if (matchIds.length > 0) {
    const { data: reviews } = await supabase
      .from('trade_reviews')
      .select('match_id')
      .eq('reviewer_id', user.id)
      .in('match_id', matchIds)
    myReviews = (reviews ?? []).map(r => r.match_id)
  }

  return NextResponse.json({ matches, myReviews })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { match_id, action, photo_url, tracking_number } = body as {
    match_id: string
    action: WorkflowAction
    photo_url?: string
    tracking_number?: string
  }

  const service = await createServiceClient()
  const { data: match } = await service
    .from('trade_matches')
    .select('*')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
    return NextResponse.json({ error: 'Not your match' }, { status: 403 })
  }

  const isUserA = match.user_a_id === user.id

  // ── decline ────────────────────────────────────────────────────────────────
  if (action === 'decline') {
    await service.from('trade_matches').update({ status: 'declined' }).eq('id', match_id)
    return NextResponse.json({ ok: true, status: 'declined' })
  }

  // ── accept (initial handshake) ─────────────────────────────────────────────
  if (action === 'accept') {
    const update = isUserA ? { user_a_accepted: true } : { user_b_accepted: true }
    const { data: updated } = await service
      .from('trade_matches')
      .update(update)
      .eq('id', match_id)
      .select()
      .single()

    if (updated?.user_a_accepted && updated?.user_b_accepted && !updated?.fee_paid) {
      const { data: profileA } = await service.from('profiles').select('stripe_customer_id').eq('id', match.user_a_id).single()
      const { data: profileB } = await service.from('profiles').select('stripe_customer_id').eq('id', match.user_b_id).single()

      if (profileA?.stripe_customer_id && profileB?.stripe_customer_id) {
        const pi = await stripe.paymentIntents.create({
          amount: toCents(2),
          currency: 'usd',
          customer: profileA.stripe_customer_id,
          confirm: false,
          metadata: { match_id, user_id: match.user_a_id, type: 'trade_fee' },
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        })
        await service.from('trade_matches').update({ status: 'accepted', fee_paid: true, stripe_payment_intent_id: pi.id }).eq('id', match_id)
      } else {
        await service.from('trade_matches').update({ status: 'accepted', fee_paid: true }).eq('id', match_id)
      }
    }

    return NextResponse.json({ ok: true, both_accepted: updated?.user_a_accepted && updated?.user_b_accepted })
  }

  // ── accept_trade_terms ─────────────────────────────────────────────────────
  if (action === 'accept_trade_terms') {
    const update = isUserA ? { user_a_trade_terms_accepted: true } : { user_b_trade_terms_accepted: true }
    await service.from('trade_matches').update(update).eq('id', match_id)
    return NextResponse.json({ ok: true })
  }

  // ── upload_photo ───────────────────────────────────────────────────────────
  if (action === 'upload_photo') {
    if (!photo_url) return NextResponse.json({ error: 'photo_url required' }, { status: 400 })
    const update = isUserA ? { user_a_photo_url: photo_url } : { user_b_photo_url: photo_url }
    await service.from('trade_matches').update(update).eq('id', match_id)
    return NextResponse.json({ ok: true })
  }

  // ── agree_ship ─────────────────────────────────────────────────────────────
  if (action === 'agree_ship') {
    const update = isUserA ? { user_a_ship_agreed: true } : { user_b_ship_agreed: true }
    await service.from('trade_matches').update(update).eq('id', match_id)
    return NextResponse.json({ ok: true })
  }

  // ── submit_tracking ────────────────────────────────────────────────────────
  if (action === 'submit_tracking') {
    if (!tracking_number?.trim()) return NextResponse.json({ error: 'tracking_number required' }, { status: 400 })
    const update = isUserA ? { user_a_tracking: tracking_number.trim() } : { user_b_tracking: tracking_number.trim() }
    await service.from('trade_matches').update(update).eq('id', match_id)
    return NextResponse.json({ ok: true })
  }

  // ── complete ───────────────────────────────────────────────────────────────
  if (action === 'complete') {
    await service.from('trade_matches').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', match_id)
    // Increment trade_count for both users
    for (const uid of [match.user_a_id, match.user_b_id]) {
      const { data: p } = await service.from('profiles').select('trade_count').eq('id', uid).single()
      await service.from('profiles').update({ trade_count: (p?.trade_count ?? 0) + 1 }).eq('id', uid)
    }
    return NextResponse.json({ ok: true, status: 'completed' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
