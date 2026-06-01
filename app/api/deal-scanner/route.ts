import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callClaude, parseJson } from '@/lib/anthropic'
import { sendDealAlert } from '@/lib/resend'
import { sendDealSMS } from '@/lib/twilio'

const ANALYZE_PROMPT = `Given this marketplace listing title and description, determine:
1. Is this a LEGO listing? (boolean)
2. If yes, what set number or sets are mentioned?
3. What is the asking price?
4. Estimate the true market value
5. Is this a good deal? (true if asking price < 60% of market value)

Respond as JSON: { "is_lego": boolean, "set_number": string|null, "asking_price": number, "estimated_value": number, "is_good_deal": boolean, "roi_percent": number }`

async function fetchFBMarketplaceListings(zipCode: string, _radiusMiles: number): Promise<Array<{
  title: string
  description: string
  price: string
  location: string
  url: string
  image: string
}>> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []
  try {
    const res = await fetch(`https://facebook-marketplace-scraper.p.rapidapi.com/marketplace?zip_code=${zipCode}&query=lego&limit=20`, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'facebook-marketplace-scraper.p.rapidapi.com',
      },
    })
    if (!res.ok) return []
    const data = await res.json() as { items?: Array<{ title?: string; description?: string; price?: string; location?: string; url?: string; image?: string }> }
    return (data.items ?? []).map((item) => ({
      title: item.title ?? '',
      description: item.description ?? '',
      price: item.price ?? '',
      location: item.location ?? zipCode,
      url: item.url ?? '',
      image: item.image ?? '',
    }))
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  // Verify cron or internal
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = await createServiceClient()

  const { data: watches } = await service
    .from('deal_watches')
    .select('*, user:profiles(id, phone, subscription_tier)')
    .eq('is_active', true)

  if (!watches?.length) return NextResponse.json({ processed: 0 })

  const uniqueZips = [...new Set(watches.map(w => w.zip_code).filter(Boolean))] as string[]
  let totalDeals = 0

  for (const zip of uniqueZips) {
    const maxRadius = Math.max(...watches.filter(w => w.zip_code === zip).map(w => w.radius_miles ?? 50))
    const listings = await fetchFBMarketplaceListings(zip, maxRadius)

    for (const listing of listings) {
      // Check duplicate
      const { data: existing } = await service
        .from('deals_found')
        .select('id')
        .eq('listing_url', listing.url)
        .single()
      if (existing) continue

      // Analyze with Claude
      const text = await callClaude(
        ANALYZE_PROMPT,
        `Title: ${listing.title}\nDescription: ${listing.description}\nPrice: ${listing.price}\nLocation: ${listing.location}`
      ).catch(() => null)
      if (!text) continue

      const analysis = parseJson<{
        is_lego: boolean
        set_number: string | null
        asking_price: number
        estimated_value: number
        is_good_deal: boolean
        roi_percent: number
      }>(text)

      if (!analysis?.is_lego || !analysis.is_good_deal) continue

      let setId: number | null = null
      let setName = listing.title
      if (analysis.set_number) {
        const { data: set } = await service.from('lego_sets').select('id, name').eq('set_number', analysis.set_number).single()
        if (set) { setId = set.id; setName = set.name }
      }

      const { data: deal } = await service.from('deals_found').insert({
        set_id: setId,
        platform: 'facebook_marketplace',
        listing_url: listing.url || `https://facebook.com/marketplace?q=lego+${zip}`,
        listed_price: analysis.asking_price,
        estimated_value: analysis.estimated_value,
        roi_percent: analysis.roi_percent,
        location: listing.location,
        zip_code: zip,
        raw_title: listing.title,
        raw_description: listing.description.slice(0, 500),
        image_url: listing.image || null,
        is_active: true,
      }).select().single()

      if (!deal) continue
      totalDeals++

      // Alert matching watchers
      const matchingWatches = watches.filter(w => {
        if (w.zip_code !== zip) return false
        if (w.max_price && analysis.asking_price > w.max_price) return false
        if (w.set_ids?.length && setId && !w.set_ids.includes(setId)) return false
        return true
      })

      for (const watch of matchingWatches) {
        const watchUser = watch.user as { id: string; phone?: string; subscription_tier?: string } | null
        if (!watchUser || watchUser.subscription_tier !== 'deal_scanner') continue

        // Check if already alerted
        const { data: alreadySent } = await service
          .from('deal_alerts_sent')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('user_id', watchUser.id)
          .single()
        if (alreadySent) continue

        const { data: authUser } = await service.auth.admin.getUserById(watchUser.id)

        if (watch.notify_email && authUser.user?.email) {
          await sendDealAlert(authUser.user.email, setName, analysis.asking_price, analysis.estimated_value, analysis.roi_percent, listing.location, deal.listing_url).catch(console.error)
          await service.from('deal_alerts_sent').insert({ deal_id: deal.id, user_id: watchUser.id, sent_via: 'email' })
        }
        if (watch.notify_sms && watchUser.phone) {
          await sendDealSMS(watchUser.phone, setName, analysis.asking_price, analysis.estimated_value, analysis.roi_percent, listing.location, deal.listing_url).catch(console.error)
          await service.from('deal_alerts_sent').insert({ deal_id: deal.id, user_id: watchUser.id, sent_via: 'sms' })
        }
      }
    }
  }

  return NextResponse.json({ processed: totalDeals, zips: uniqueZips.length })
}
