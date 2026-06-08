import { NextRequest, NextResponse } from 'next/server'
import { fetchAndSavePrices, getCachedPrices } from '@/lib/pricing'

export async function GET(req: NextRequest) {
  const setNumber = req.nextUrl.searchParams.get('set')
  const refresh   = req.nextUrl.searchParams.get('refresh') === '1'

  if (!setNumber) {
    return NextResponse.json({ error: 'Missing ?set= parameter' }, { status: 400 })
  }

  try {
    if (!refresh) {
      const cached = await getCachedPrices(setNumber)
      if (cached) {
        return NextResponse.json({ source: 'cache', data: cached })
      }
    }

    const data = await fetchAndSavePrices(setNumber)
    return NextResponse.json({ source: 'live', data })

  } catch (err: any) {
    console.error('[/api/pricing] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
