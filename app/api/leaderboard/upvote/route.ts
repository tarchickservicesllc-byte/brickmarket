import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { flip_entry_id } = await request.json()
  if (!flip_entry_id) return NextResponse.json({ error: 'flip_entry_id required' }, { status: 400 })

  // Insert upvote record (unique constraint prevents double voting)
  const { error: upvoteError } = await supabase.from('flip_upvotes').insert({
    flip_entry_id,
    user_id: user.id,
  })

  if (upvoteError) {
    return NextResponse.json({ error: 'Already upvoted' }, { status: 409 })
  }

  // Increment count using service client (bypasses RLS on other users' flips)
  const service = await createServiceClient()
  const { data: entry } = await service.from('flip_entries').select('upvotes').eq('id', flip_entry_id).single()
  await service.from('flip_entries').update({ upvotes: (entry?.upvotes ?? 0) + 1 }).eq('id', flip_entry_id)

  return NextResponse.json({ success: true })
}
