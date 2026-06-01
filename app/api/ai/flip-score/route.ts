import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { callClaude, parseJson } from '@/lib/anthropic'

const FREE_LIMIT = 3

const SYSTEM_PROMPT = `You are a LEGO investment analyst with 10 years of experience.
Given data about a LEGO set, calculate a Flip Score from 1-100 where:
- 90-100: Exceptional flip opportunity, buy immediately
- 70-89: Strong flip, good ROI likely
- 50-69: Moderate, worth holding
- 30-49: Below average, consider selling
- 1-29: Poor flip potential

Factors to weigh:
1. Time since/until retirement (retired sets appreciate fast in first 6-18 months)
2. Theme popularity (Icons, Star Wars UCS, Harry Potter = high demand)
3. Current price vs retail (discount = buy signal)
4. Piece count per dollar (higher = better value)
5. Seasonal timing (Q4 holiday season = peak sell time)
6. Set exclusivity (LEGO exclusive vs mass retail)

Respond ONLY with valid JSON:
{ "score": number, "rating": string, "top_reason": string, "buy_signal": boolean, "best_sell_window": string, "risk_level": "low"|"medium"|"high", "breakdown": { "retirement": number, "demand": number, "price": number, "timing": number, "exclusivity": number } }`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { set_number } = body as { set_number: string }
  if (!set_number) return NextResponse.json({ error: 'set_number required' }, { status: 400 })

  // Fetch set
  const { data: set } = await supabase
    .from('lego_sets')
    .select('*')
    .eq('set_number', set_number)
    .single()

  if (!set) return NextResponse.json({ error: 'Set not found' }, { status: 404 })

  // Check if cached and fresh (< 24h)
  if (set.flip_score && set.flip_score_updated_at) {
    const age = Date.now() - new Date(set.flip_score_updated_at).getTime()
    if (age < 24 * 60 * 60 * 1000) {
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
      const isPro = profile?.subscription_tier !== 'free'
      return NextResponse.json({
        score: set.flip_score,
        reasoning: isPro ? set.flip_score_reasoning : null,
        cached: true,
        isPro,
      })
    }
  }

  // Check usage for free users
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, flip_score_scans_used')
    .eq('id', user.id)
    .single()

  const isPro = profile?.subscription_tier !== 'free'

  if (!isPro && (profile?.flip_score_scans_used ?? 0) >= FREE_LIMIT) {
    return NextResponse.json({ error: 'Monthly limit reached. Upgrade to Pro for unlimited scans.', limitReached: true }, { status: 429 })
  }

  const now = new Date()
  const userMessage = `Analyze this LEGO set:
Set Number: ${set.set_number}
Name: ${set.name}
Theme: ${set.theme ?? 'Unknown'}
Year Released: ${set.year_released ?? 'Unknown'}
Retail Price: $${set.retail_price ?? 'Unknown'}
Piece Count: ${set.piece_count ?? 'Unknown'}
Is Retired: ${set.is_retired}
Retirement Date: ${set.retirement_date ?? 'Not yet retired'}
BrickLink Avg Price: $${set.bricklink_avg_price ?? 'Unknown'}
eBay Avg Price: $${set.ebay_avg_price ?? 'Unknown'}
Current Month: ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`

  let result: {
    score: number
    rating: string
    top_reason: string
    buy_signal: boolean
    best_sell_window: string
    risk_level: string
    breakdown: Record<string, number>
  } | null = null

  try {
    const text = await callClaude(SYSTEM_PROMPT, userMessage)
    result = parseJson(text)
  } catch {
    return NextResponse.json({ error: 'AI service unavailable. Try again.' }, { status: 503 })
  }

  if (!result) return NextResponse.json({ error: 'AI returned invalid data' }, { status: 500 })

  // Store in DB
  const service = await createServiceClient()
  await service.from('lego_sets').update({
    flip_score: result.score,
    flip_score_reasoning: JSON.stringify(result),
    flip_score_updated_at: now.toISOString(),
  }).eq('set_number', set_number)

  // Increment scan count for free users
  if (!isPro) {
    await service.from('profiles').update({
      flip_score_scans_used: (profile?.flip_score_scans_used ?? 0) + 1,
    }).eq('id', user.id)
  }

  return NextResponse.json({
    score: result.score,
    rating: result.rating,
    buy_signal: result.buy_signal,
    top_reason: result.top_reason,
    best_sell_window: isPro ? result.best_sell_window : null,
    risk_level: isPro ? result.risk_level : null,
    breakdown: isPro ? result.breakdown : null,
    isPro,
  })
}
