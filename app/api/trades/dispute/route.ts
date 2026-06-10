import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendTradeDisputeEmail } from '@/lib/resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { match_id, reason, description } = body as { match_id: string; reason: string; description: string }

  if (!match_id || !reason?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'match_id, reason, and description are required' }, { status: 400 })
  }

  const service = await createServiceClient()

  // Verify user is in this match
  const { data: match } = await service
    .from('trade_matches')
    .select('user_a_id, user_b_id')
    .eq('id', match_id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.user_a_id !== user.id && match.user_b_id !== user.id) {
    return NextResponse.json({ error: 'Not your match' }, { status: 403 })
  }

  const other_user_id = match.user_a_id === user.id ? match.user_b_id : match.user_a_id

  // Get usernames for email
  const [{ data: myProfile }, { data: otherProfile }] = await Promise.all([
    service.from('profiles').select('username').eq('id', user.id).single(),
    service.from('profiles').select('username').eq('id', other_user_id).single(),
  ])

  // Insert dispute
  const { error } = await service.from('trade_disputes').insert({
    match_id,
    filed_by: user.id,
    reason: reason.trim(),
    description: description.trim(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark match as disputed
  await service.from('trade_matches').update({ dispute_filed: true, status: 'disputed' }).eq('id', match_id)

  // Email admin
  await sendTradeDisputeEmail(
    match_id,
    myProfile?.username ?? 'unknown',
    otherProfile?.username ?? 'unknown',
    reason.trim(),
    description.trim()
  ).catch(console.error)

  return NextResponse.json({ ok: true })
}
