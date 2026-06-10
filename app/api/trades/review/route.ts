import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { match_id, rating, body: reviewBody } = body as { match_id: string; rating: number; body?: string }

  if (!match_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'match_id and rating (1-5) are required' }, { status: 400 })
  }

  const service = await createServiceClient()

  // Verify user is in this match and it's completed
  const { data: match } = await service
    .from('trade_matches')
    .select('user_a_id, user_b_id, status')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
    return NextResponse.json({ error: 'Not your match' }, { status: 403 })
  }
  if (match.status !== 'completed') {
    return NextResponse.json({ error: 'Trade is not completed yet' }, { status: 400 })
  }

  const reviewee_id = match.user_a_id === user.id ? match.user_b_id : match.user_a_id

  // Insert review (unique constraint prevents duplicates)
  const { error } = await service.from('trade_reviews').insert({
    match_id,
    reviewer_id: user.id,
    reviewee_id,
    rating,
    body: reviewBody?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You already reviewed this trade' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Recompute reviewee's average rating and store it
  const { data: allReviews } = await service
    .from('trade_reviews')
    .select('rating')
    .eq('reviewee_id', reviewee_id)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await service.from('profiles').update({ trade_rating_avg: Math.round(avg * 100) / 100 }).eq('id', reviewee_id)
  }

  return NextResponse.json({ ok: true })
}
