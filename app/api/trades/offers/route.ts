import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendTradeMatchEmail } from '@/lib/resend'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: offers } = await supabase
    .from('trade_offers')
    .select('*, user:profiles(username, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ offers })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier === 'free') {
    return NextResponse.json({ error: 'Trade Matchmaker requires Pro subscription.', upgrade: true }, { status: 403 })
  }

  const body = await request.json()
  const { have_set_ids, want_set_ids, notes } = body as { have_set_ids: number[]; want_set_ids: number[]; notes?: string }

  if (!have_set_ids?.length || !want_set_ids?.length) {
    return NextResponse.json({ error: 'have_set_ids and want_set_ids are required' }, { status: 400 })
  }

  const service = await createServiceClient()
  const { data: offer, error } = await service.from('trade_offers').insert({
    user_id: user.id,
    have_set_ids,
    want_set_ids,
    notes: notes ?? null,
    status: 'open',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Run matching algorithm
  const { data: potentialMatches } = await service
    .from('trade_offers')
    .select('*, user:profiles(id, username, phone)')
    .eq('status', 'open')
    .neq('user_id', user.id)

  const matches = []
  for (const other of (potentialMatches ?? [])) {
    const iHaveWhatTheyWant = want_set_ids.some(id => other.have_set_ids.includes(id))
    const theyHaveWhatIWant = have_set_ids.some(id => other.want_set_ids.includes(id))
    if (!iHaveWhatTheyWant || !theyHaveWhatIWant) continue

    const overlapA = want_set_ids.filter(id => other.have_set_ids.includes(id)).length
    const overlapB = have_set_ids.filter(id => other.want_set_ids.includes(id)).length
    const maxPossible = Math.max(want_set_ids.length, have_set_ids.length, other.want_set_ids.length, other.have_set_ids.length)
    const score = Math.round(((overlapA + overlapB) / (maxPossible * 2)) * 100)

    const { data: match } = await service.from('trade_matches').insert({
      offer_a_id: offer.id,
      offer_b_id: other.id,
      user_a_id: user.id,
      user_b_id: other.user_id,
      match_score: score,
      status: 'pending',
    }).select().single()

    if (match) {
      matches.push(match)

      // Notify both users
      const { data: userA } = await service.auth.admin.getUserById(user.id)
      const { data: userB } = await service.auth.admin.getUserById(other.user_id)

      if (userA.user?.email) {
        await sendTradeMatchEmail(userA.user.email, (other.user as { username?: string } | null)?.username ?? 'a user', score, (other.user as { username?: string } | null)?.username ?? 'a user').catch(console.error)
      }
      if (userB.user?.email) {
        await sendTradeMatchEmail(userB.user.email, (other.user as { username?: string } | null)?.username ?? 'a user', score, profile?.subscription_tier ?? '').catch(console.error)
      }
    }
  }

  return NextResponse.json({ offer, matches_found: matches.length }, { status: 201 })
}
