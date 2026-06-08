import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAndSavePrices } from '@/lib/pricing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: listings, error } = await supabase
      .from('listings')
      .select('set_number')
      .not('set_number', 'is', null)

    if (error) throw error

    const setNumbers = [...new Set(listings.map((l: any) => l.set_number))] as string[]
    console.log(`[cron/refresh-prices] Refreshing ${setNumbers.length} sets...`)

    const results = { success: 0, failed: 0, sets: [] as string[] }

    for (const setNumber of setNumbers) {
      try {
        await fetchAndSavePrices(setNumber)
        results.success++
        results.sets.push(setNumber)
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        console.error(`[cron] Failed for set ${setNumber}:`, err)
        results.failed++
      }
    }

    return NextResponse.json({
      message: `Refreshed prices for ${results.success} sets, ${results.failed} failed`,
      ...results,
    })

  } catch (err: any) {
    console.error('[cron/refresh-prices] Fatal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
