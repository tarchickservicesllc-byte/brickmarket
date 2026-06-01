import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendDealAlert } from '@/lib/resend'

interface RetailDeal {
  platform: string
  title: string
  set_number: string | null
  url: string
  sale_price: number
  original_price: number
  discount_percent: number
  image_url: string | null
  location: string
}

// ── Walmart ──────────────────────────────────────────────────────────────────
async function scanWalmart(): Promise<RetailDeal[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  const deals: RetailDeal[] = []
  try {
    // Search for LEGO clearance/rollback items
    const [clearanceRes, rollbackRes] = await Promise.all([
      fetch('https://realtime-walmart-data.p.rapidapi.com/search?keyword=lego+clearance', {
        headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'realtime-walmart-data.p.rapidapi.com' },
      }),
      fetch('https://realtime-walmart-data.p.rapidapi.com/search?keyword=lego+rollback', {
        headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'realtime-walmart-data.p.rapidapi.com' },
      }),
    ])

    const seen = new Set<string>()
    for (const res of [clearanceRes, rollbackRes]) {
      if (!res.ok) continue
      const data = await res.json() as { results?: Array<{ name?: string; price?: string; originalPrice?: string; savings?: string; canonicalUrl?: string; thumbnailUrl?: string }> }
      for (const item of (data.results ?? [])) {
        if (!item.name?.toLowerCase().includes('lego')) continue
        if (seen.has(item.canonicalUrl ?? '')) continue
        seen.add(item.canonicalUrl ?? '')

        const salePrice = parseFloat((item.price ?? '0').replace(/[^0-9.]/g, ''))
        const origPrice = parseFloat((item.originalPrice ?? '0').replace(/[^0-9.]/g, ''))
        if (!origPrice || !salePrice || salePrice >= origPrice) continue
        const discount = Math.round(((origPrice - salePrice) / origPrice) * 100)
        if (discount < 15) continue

        const setMatch = item.name.match(/\b(\d{4,6})\b/)
        deals.push({
          platform: 'walmart',
          title: item.name,
          set_number: setMatch?.[1] ?? null,
          url: item.canonicalUrl ?? 'https://walmart.com',
          sale_price: salePrice,
          original_price: origPrice,
          discount_percent: discount,
          image_url: item.thumbnailUrl ?? null,
          location: 'Walmart.com',
        })
      }
    }
  } catch (err) {
    console.error('Walmart scan error:', err)
  }
  return deals
}

// ── Target ────────────────────────────────────────────────────────────────────
async function scanTarget(): Promise<RetailDeal[]> {
  const key = process.env.TARGET_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY
  if (!key) return []

  const deals: RetailDeal[] = []
  try {
    const res = await fetch(
      'https://target-com-shopping-api.p.rapidapi.com/community/v1/plp/search?keyword=lego+clearance&count=24&offset=0',
      {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': 'target-com-shopping-api.p.rapidapi.com',
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json() as { data?: { search?: { products?: { items?: Array<{ item?: { enrichment?: { images?: { primaryImageUrl?: string }; buyUrl?: string }; product_description?: { title?: string }; price?: { current_retail?: number; reg_retail?: number }; tcin?: string } }> } } } }
    const items = data?.data?.search?.products?.items ?? []

    for (const { item } of items) {
      if (!item) continue
      const title = item.product_description?.title ?? ''
      if (!title.toLowerCase().includes('lego')) continue
      const salePrice = item.price?.current_retail ?? 0
      const origPrice = item.price?.reg_retail ?? salePrice
      if (origPrice <= 0 || salePrice >= origPrice) continue
      const discount = Math.round(((origPrice - salePrice) / origPrice) * 100)
      if (discount < 20) continue

      const setMatch = title.match(/\b(\d{4,6})\b/)
      deals.push({
        platform: 'target',
        title,
        set_number: setMatch?.[1] ?? null,
        url: item.enrichment?.buyUrl ?? 'https://target.com',
        sale_price: salePrice,
        original_price: origPrice,
        discount_percent: discount,
        image_url: item.enrichment?.images?.primaryImageUrl ?? null,
        location: 'Target.com',
      })
    }
  } catch (err) {
    console.error('Target scan error:', err)
  }
  return deals
}

// ── LEGO.com Official Clearance ───────────────────────────────────────────────
async function scanLEGOOfficial(): Promise<RetailDeal[]> {
  const deals: RetailDeal[] = []
  try {
    const res = await fetch(
      'https://www.lego.com/en-us/categories/deals-and-promotions?offset=0&pageSize=24',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; BrickMarketBot/1.0)',
        },
      }
    )
    if (!res.ok) return []
    const text = await res.text()

    // Extract product data from LEGO's Next.js __NEXT_DATA__ payload
    const match = text.match(/"id":"(\d{5,6})","name":"([^"]+)","prices":\{"regular":(\d+\.?\d*),"sale":(\d+\.?\d*)/)
    if (!match) return []

    const [, setNumber, name, regular, sale] = match
    const regularPrice = parseFloat(regular)
    const salePrice = parseFloat(sale)
    if (regularPrice <= 0 || salePrice >= regularPrice) return []
    const discount = Math.round(((regularPrice - salePrice) / regularPrice) * 100)
    if (discount < 20) return []

    deals.push({
      platform: 'lego_official',
      title: name,
      set_number: setNumber,
      url: `https://www.lego.com/en-us/product/${setNumber}`,
      sale_price: salePrice,
      original_price: regularPrice,
      discount_percent: discount,
      image_url: null,
      location: 'LEGO.com',
    })
  } catch (err) {
    console.error('LEGO.com scan error:', err)
  }
  return deals
}

// ── Amazon ────────────────────────────────────────────────────────────────────
async function scanAmazon(): Promise<RetailDeal[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  const deals: RetailDeal[] = []
  try {
    const queries = ['lego sale', 'lego clearance', 'lego deals']
    const seen = new Set<string>()

    for (const query of queries) {
      const res = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&country=US`,
        {
          headers: {
            'x-rapidapi-key': key,
            'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com',
          },
        }
      )
      if (!res.ok) continue
      const data = await res.json() as { data?: { products?: Array<{ product_title?: string; product_price?: string; product_original_price?: string; product_url?: string; product_photo?: string }> } }

      for (const product of (data?.data?.products ?? [])) {
        const title = product.product_title ?? ''
        if (!title.toLowerCase().includes('lego')) continue
        if (seen.has(product.product_url ?? '')) continue
        seen.add(product.product_url ?? '')

        const salePrice = parseFloat((product.product_price ?? '0').replace(/[^0-9.]/g, ''))
        const origPrice = parseFloat((product.product_original_price ?? '0').replace(/[^0-9.]/g, ''))
        if (!origPrice || !salePrice || salePrice >= origPrice) continue
        const discount = Math.round(((origPrice - salePrice) / origPrice) * 100)
        if (discount < 15) continue

        const setMatch = title.match(/\b(\d{4,6})\b/)
        deals.push({
          platform: 'amazon',
          title,
          set_number: setMatch?.[1] ?? null,
          url: product.product_url ?? 'https://amazon.com',
          sale_price: salePrice,
          original_price: origPrice,
          discount_percent: discount,
          image_url: product.product_photo ?? null,
          location: 'Amazon.com',
        })
      }
    }
  } catch (err) {
    console.error('Amazon scan error:', err)
  }
  return deals
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = await createServiceClient()
  const [walmartDeals, targetDeals, legoDeals, amazonDeals] = await Promise.all([
    scanWalmart(),
    scanTarget(),
    scanLEGOOfficial(),
    scanAmazon(),
  ])

  const allDeals = [...walmartDeals, ...targetDeals, ...legoDeals, ...amazonDeals]
  let saved = 0

  for (const deal of allDeals) {
    // Check for duplicate
    const { data: existing } = await service
      .from('deals_found')
      .select('id')
      .eq('listing_url', deal.url)
      .single()
    if (existing) continue

    // Match to known set if possible
    let setId: number | null = null
    if (deal.set_number) {
      const { data: set } = await service
        .from('lego_sets')
        .select('id')
        .eq('set_number', deal.set_number)
        .single()
      if (set) setId = set.id
    }

    const roiPercent = deal.discount_percent

    const { data: inserted } = await service.from('deals_found').insert({
      set_id: setId,
      platform: deal.platform,
      listing_url: deal.url,
      listed_price: deal.sale_price,
      estimated_value: deal.original_price,
      roi_percent: roiPercent,
      location: deal.location,
      raw_title: deal.title,
      image_url: deal.image_url,
      is_active: true,
    }).select().single()

    if (!inserted) continue
    saved++

    // Only alert for 30%+ off deals
    if (deal.discount_percent < 30) continue

    // Find Pro users with active deal watches
    const { data: watches } = await service
      .from('deal_watches')
      .select('*, user:profiles(id, subscription_tier)')
      .eq('is_active', true)

    for (const watch of (watches ?? [])) {
      const watchUser = watch.user as { id: string; subscription_tier?: string } | null
      if (!watchUser || watchUser.subscription_tier !== 'deal_scanner') continue
      if (watch.max_price && deal.sale_price > watch.max_price) continue

      const { data: alreadySent } = await service
        .from('deal_alerts_sent')
        .select('id')
        .eq('deal_id', inserted.id)
        .eq('user_id', watchUser.id)
        .single()
      if (alreadySent) continue

      const { data: authUser } = await service.auth.admin.getUserById(watchUser.id)
      if (watch.notify_email && authUser.user?.email) {
        const subject = `${deal.platform.charAt(0).toUpperCase() + deal.platform.slice(1).replace('_', ' ')} Sale: ${deal.title} — ${deal.discount_percent}% off`
        await sendDealAlert(
          authUser.user.email,
          deal.title,
          deal.sale_price,
          deal.original_price,
          roiPercent,
          deal.location,
          deal.url
        ).catch(console.error)
        await service.from('deal_alerts_sent').insert({
          deal_id: inserted.id,
          user_id: watchUser.id,
          sent_via: 'email',
        })
      }
    }
  }

  return NextResponse.json({
    scanned: { walmart: walmartDeals.length, target: targetDeals.length, lego: legoDeals.length, amazon: amazonDeals.length },
    saved,
  })
}
