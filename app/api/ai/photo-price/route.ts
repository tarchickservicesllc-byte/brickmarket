import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { callClaudeWithImage, parseJson } from '@/lib/anthropic'

const FREE_LIMIT = 3

const SYSTEM_PROMPT = `You are a LEGO expert who can identify any LEGO set from photos.
Look at this image and identify the LEGO set.

Respond ONLY with valid JSON:
{
  "identified": boolean,
  "set_number": string or null,
  "set_name": string or null,
  "confidence": "high"|"medium"|"low",
  "condition_estimate": "new_sealed"|"used_complete"|"used_incomplete"|"loose_bricks",
  "estimated_value_low": number,
  "estimated_value_high": number,
  "recommendation": "sell_now"|"hold"|"buy_more",
  "recommendation_reason": string,
  "completeness_notes": string
}

If you see loose bricks (not a complete set), estimate the total weight/count and give a rough value range for bulk lots.`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { image_base64, mime_type } = body as { image_base64: string; mime_type: string }
  if (!image_base64 || !mime_type) return NextResponse.json({ error: 'image_base64 and mime_type required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, photo_scans_used')
    .eq('id', user.id)
    .single()

  const isPro = profile?.subscription_tier !== 'free'

  if (!isPro && (profile?.photo_scans_used ?? 0) >= FREE_LIMIT) {
    return NextResponse.json({ error: 'Monthly scan limit reached. Upgrade to Pro for unlimited scans.', limitReached: true }, { status: 429 })
  }

  const validMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
  type ValidMime = typeof validMime[number]
  if (!validMime.includes(mime_type as ValidMime)) {
    return NextResponse.json({ error: 'Invalid image type. Use JPEG, PNG, GIF, or WebP.' }, { status: 400 })
  }

  let result: {
    identified: boolean
    set_number: string | null
    set_name: string | null
    confidence: string
    condition_estimate: string
    estimated_value_low: number
    estimated_value_high: number
    recommendation: string
    recommendation_reason: string
    completeness_notes: string
  } | null = null

  try {
    const text = await callClaudeWithImage(SYSTEM_PROMPT, image_base64, mime_type as ValidMime)
    result = parseJson(text)
  } catch {
    return NextResponse.json({ error: 'AI service unavailable. Try again.' }, { status: 503 })
  }

  if (!result) return NextResponse.json({ error: 'AI returned invalid data' }, { status: 500 })

  // Lookup live price data if set identified
  let setData = null
  if (result.identified && result.set_number) {
    const { data } = await supabase
      .from('lego_sets')
      .select('id, name, set_number, theme, image_url, bricklink_avg_price, retail_price, is_retired, flip_score')
      .eq('set_number', result.set_number)
      .single()
    setData = data
  }

  // Increment scan count for free users
  if (!isPro) {
    const service = await createServiceClient()
    await service.from('profiles').update({
      photo_scans_used: (profile?.photo_scans_used ?? 0) + 1,
    }).eq('id', user.id)
  }

  return NextResponse.json({ ...result, setData })
}
