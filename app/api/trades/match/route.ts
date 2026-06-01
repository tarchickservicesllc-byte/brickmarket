import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, toCents } from '@/lib/stripe'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: matches } = await supabase
    .from('trade_matches')
    .select(`
      *,
      offer_a:trade_offers!trade_matches_offer_a_id_fkey(*, user:profiles(username, avatar_url)),
      offer_b:trade_offers!trade_matches_offer_b_id_fkey(*, user:profiles(username, avatar_url))
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return NextResponse.json({ matches })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { match_id, action } = body as { match_id: string; action: 'accept' | 'decline' }

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

  if (action === 'decline') {
    await service.from('trade_matches').update({ status: 'declined' }).eq('id', match_id)
    return NextResponse.json({ status: 'declined' })
  }

  const isUserA = match.user_a_id === user.id
  const update: Record<string, boolean> = isUserA ? { user_a_accepted: true } : { user_b_accepted: true }
  const { data: updated } = await service
    .from('trade_matches')
    .update(update)
    .eq('id', match_id)
    .select()
    .single()

  if (updated?.user_a_accepted && updated?.user_b_accepted && !updated?.fee_paid) {
    // Both accepted — charge both users $2
    const { data: profileA } = await service.from('profiles').select('stripe_customer_id').eq('id', match.user_a_id).single()
    const { data: profileB } = await service.from('profiles').select('stripe_customer_id').eq('id', match.user_b_id).single()

    if (profileA?.stripe_customer_id && profileB?.stripe_customer_id) {
      const piA = await stripe.paymentIntents.create({
        amount: toCents(2),
        currency: 'usd',
        customer: profileA.stripe_customer_id,
        confirm: false,
        metadata: { match_id, user_id: match.user_a_id, type: 'trade_fee' },
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      })
      await service.from('trade_matches').update({
        status: 'accepted',
        fee_paid: true,
        stripe_payment_intent_id: piA.id,
      }).eq('id', match_id)
    } else {
      await service.from('trade_matches').update({ status: 'accepted', fee_paid: true }).eq('id', match_id)
    }
  }

  return NextResponse.json({ status: 'accepted', both_accepted: updated?.user_a_accepted && updated?.user_b_accepted })
}
