import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getWeekNumber } from '@/lib/utils'
import { sendWeeklyChampionEmail } from '@/lib/resend'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = await createServiceClient()
  const now = new Date()
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekNum = getWeekNumber(lastWeek)
  const year = lastWeek.getFullYear()

  // Find top flip of the week
  const { data: topFlip } = await service
    .from('flip_entries')
    .select('*, user:profiles(id, username), lego_set:lego_sets(name)')
    .eq('week_number', weekNum)
    .eq('year', year)
    .order('roi_percent', { ascending: false })
    .limit(1)
    .single()

  if (!topFlip) return NextResponse.json({ message: 'No flips this week' })

  // Record champion
  await service.from('weekly_champions').insert({
    flip_entry_id: topFlip.id,
    user_id: topFlip.user_id,
    week_number: weekNum,
    year,
    roi_percent: topFlip.roi_percent,
  })

  // Email the winner
  const { data: authUser } = await service.auth.admin.getUserById(topFlip.user_id)
  if (authUser.user?.email) {
    const setName = (topFlip.lego_set as { name?: string } | null)?.name ?? 'Unknown Set'
    await sendWeeklyChampionEmail(
      authUser.user.email,
      (topFlip.user as { username?: string } | null)?.username ?? 'Champion',
      setName,
      topFlip.roi_percent ?? 0,
      topFlip.profit_dollars ?? 0
    ).catch(console.error)
  }

  return NextResponse.json({ champion: topFlip.user_id, week: weekNum, year })
}
