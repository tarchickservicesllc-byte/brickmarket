/**
 * app/api/cron/refresh-prices/route.ts
 * ──────────────────────────────────────────────────────────
 * DROP THIS FILE INTO: /app/api/cron/refresh-prices/route.ts
 *
 * Vercel cron job — runs daily at 3am UTC.
 * Pulls every set_number from your `listings` table and refreshes
 * prices from BrickLink, eBay, and LEGO.com.
 *
 * Secured by CRON_SECRET env var (already in your .env per your README).
 * ──────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAndSavePrices } from '@/lib/pricing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel calls this endpoint on the cron schedule defined in vercel.json
export async function GET(req: NextRequest) {
  // Verify the request is from Vercel cron (or your own call)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all unique set numbers that have active listings
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
        // Delay between sets to respect API rate limits
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
