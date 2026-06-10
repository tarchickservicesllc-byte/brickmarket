import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PriceData {
  set_number:         string
  fetched_at:         string
  bl_new_avg:         number | null
  bl_new_min:         number | null
  bl_new_max:         number | null
  bl_new_qty_sold:    number | null
  bl_used_avg:        number | null
  bl_used_min:        number | null
  bl_used_max:        number | null
  bl_used_qty_sold:   number | null
  ebay_new_avg:       number | null
  ebay_new_min:       number | null
  ebay_new_max:       number | null
  ebay_new_listings:  number | null
  ebay_used_avg:      number | null
  ebay_used_min:      number | null
  ebay_used_max:      number | null
  ebay_used_listings: number | null
  lego_retail_price:  number | null
  lego_availability:  string | null
  suggested_price:    number | null
}

const blOAuth = OAuth({
  consumer: {
    key:    process.env.BRICKLINK_CONSUMER_KEY!,
    secret: process.env.BRICKLINK_CONSUMER_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base: string, key: string) {
    return crypto.createHmac('sha1', key).update(base).digest('base64')
  },
})

async function fetchBrickLinkPrice(setNumber: string, newOrUsed: 'N' | 'U') {
  const blSetNumber = `${setNumber}-1`
  const url = `https://api.bricklink.com/api/store/v1/items/SET/${blSetNumber}/price`
  const params = new URLSearchParams({
    guide_type:    'sold',
    new_or_used:   newOrUsed,
    currency_code: 'USD',
  })
  const requestData = { url, method: 'GET' }
  const token = {
    key:    process.env.BRICKLINK_TOKEN!,
    secret: process.env.BRICKLINK_TOKEN_SECRET!,
  }
  const authHeader = blOAuth.toHeader(blOAuth.authorize(requestData, token))
  try {
    const res = await fetch(`${url}?${params}`, {
      headers: { ...authHeader, 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`BrickLink ${res.status}`)
    const json = await res.json()
    const d = json.data
    return {
      avg:     parseFloat(d.avg_price)  || null,
      min:     parseFloat(d.min_price)  || null,
      max:     parseFloat(d.max_price)  || null,
      qtySold: d.total_quantity         || null,
    }
  } catch (err) {
    console.error(`[BrickLink] ${setNumber} (${newOrUsed}):`, err)
    return { avg: null, min: null, max: null, qtySold: null }
  }
}

let _ebayToken: string | null = null
let _ebayTokenExpiry = 0

async function getEbayToken(): Promise<string> {
  if (_ebayToken && Date.now() < _ebayTokenExpiry) return _ebayToken
  const credentials = Buffer.from(
    `${process.env.EBAY_APP_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString('base64')
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  })
  const data = await res.json()
  _ebayToken       = data.access_token
  _ebayTokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _ebayToken!
}

async function fetchEbayPrice(setNumber: string, condition: 'NEW' | 'USED') {
  const token       = await getEbayToken()
  const conditionId = condition === 'NEW' ? '1000' : '3000'
  try {
    const params = new URLSearchParams({
      q:      `LEGO set ${setNumber}`,
      filter: `conditionIds:{${conditionId}},buyingOptions:{FIXED_PRICE}`,
      sort:   'price',
      limit:  '20',
    })
    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization:             `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      }
    )
    if (!res.ok) throw new Error(`eBay ${res.status}`)
    const json = await res.json()
    const items: any[] = json.itemSummaries || []
    if (!items.length) return { avg: null, min: null, max: null, listings: null }
    const prices = items.map(i => parseFloat(i.price.value)).filter(p => !isNaN(p))
    const avg    = prices.reduce((a, b) => a + b, 0) / prices.length
    return {
      avg:      parseFloat(avg.toFixed(2)),
      min:      Math.min(...prices),
      max:      Math.max(...prices),
      listings: prices.length,
    }
  } catch (err) {
    console.error(`[eBay] ${setNumber} (${condition}):`, err)
    return { avg: null, min: null, max: null, listings: null }
  }
}

async function fetchLegoPrice(setNumber: string) {
  try {
    const res = await fetch(`https://www.lego.com/en-us/product/${setNumber}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BrickMarket/1.0)' },
    })
    const html       = await res.text()
    const priceMatch = html.match(/"price":\s*\{[^}]*"amount":\s*"?([\d.]+)"?/)
    const availMatch = html.match(/"availability":\s*"([^"]+)"/)
    return {
      retailPrice:  priceMatch ? parseFloat(priceMatch[1]) : null,
      availability: availMatch ? availMatch[1] : null,
    }
  } catch (err) {
    console.error(`[LEGO.com] ${setNumber}:`, err)
    return { retailPrice: null, availability: null }
  }
}

export async function fetchAllPrices(setNumber: string): Promise<PriceData> {
  const [blNew, blUsed, ebayNew, ebayUsed, lego] = await Promise.all([
    fetchBrickLinkPrice(setNumber, 'N'),
    fetchBrickLinkPrice(setNumber, 'U'),
    fetchEbayPrice(setNumber, 'NEW'),
    fetchEbayPrice(setNumber, 'USED'),
    fetchLegoPrice(setNumber),
  ])
  const prices = [blNew.avg, ebayNew.avg].filter((p): p is number => p !== null)
  const suggestedPrice = prices.length
    ? parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
    : null
  return {
    set_number:         setNumber,
    fetched_at:         new Date().toISOString(),
    bl_new_avg:         blNew.avg,
    bl_new_min:         blNew.min,
    bl_new_max:         blNew.max,
    bl_new_qty_sold:    blNew.qtySold,
    bl_used_avg:        blUsed.avg,
    bl_used_min:        blUsed.min,
    bl_used_max:        blUsed.max,
    bl_used_qty_sold:   blUsed.qtySold,
    ebay_new_avg:       ebayNew.avg,
    ebay_new_min:       ebayNew.min,
    ebay_new_max:       ebayNew.max,
    ebay_new_listings:  ebayNew.listings,
    ebay_used_avg:      ebayUsed.avg,
    ebay_used_min:      ebayUsed.min,
    ebay_used_max:      ebayUsed.max,
    ebay_used_listings: ebayUsed.listings,
    lego_retail_price:  lego.retailPrice,
    lego_availability:  lego.availability,
    suggested_price:    suggestedPrice,
  }
}

export async function savePricesToDB(data: PriceData) {
  const { error } = await supabase
    .from('set_prices')
    .upsert(data, { onConflict: 'set_number' })
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`)
}

export async function fetchAndSavePrices(setNumber: string): Promise<PriceData> {
  const data = await fetchAllPrices(setNumber)
  await savePricesToDB(data)
  return data
}

export async function getCachedPrices(setNumber: string): Promise<PriceData | null> {
  const { data, error } = await supabase
    .from('set_prices')
    .select('*')
    .eq('set_number', setNumber)
    .single()
  if (error || !data) return null
  return data as PriceData
}
