import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { callClaude, parseJson } from '@/lib/anthropic'

const SYSTEM_PROMPT = (budget: number, goal: string, months: number, risk: string, theme: string | null, date: string) =>
  `You are a LEGO investment advisor. A collector has $${budget} to spend on LEGO sets.
Their goal is ${goal} over ${months} months with ${risk} risk tolerance.${theme ? `\nThey prefer ${theme} sets.` : ''}

Based on your knowledge of the LEGO market, create a specific buying plan.
Current date: ${date}. Factor in seasonal timing.

Respond ONLY with valid JSON:
{
  "summary": string,
  "total_budget_used": number,
  "projected_return": number,
  "projected_roi_percent": number,
  "confidence": "conservative_estimate"|"moderate_estimate"|"optimistic_estimate",
  "purchases": [
    {
      "set_number": string,
      "set_name": string,
      "theme": string,
      "quantity": number,
      "estimated_buy_price": number,
      "where_to_buy": string,
      "reason": string,
      "hold_until": string,
      "projected_sell_price": number,
      "projected_roi": number,
      "risk": "low"|"medium"|"high"
    }
  ],
  "strategy_notes": string,
  "timing_advice": string,
  "warnings": string[]
}`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier === 'free') {
    return NextResponse.json({ error: 'Budget Builder requires Pro or Deal Scanner subscription.', upgrade: true }, { status: 403 })
  }

  const body = await request.json()
  const { budget, goal, timeline_months, theme_preference, risk_tolerance } = body as {
    budget: number
    goal: string
    timeline_months: number
    theme_preference: string | null
    risk_tolerance: string
  }

  if (!budget || !goal || !timeline_months || !risk_tolerance) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const date = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  let plan = null
  try {
    const text = await callClaude(
      SYSTEM_PROMPT(budget, goal, timeline_months, risk_tolerance, theme_preference ?? null, date),
      `Generate a LEGO investment plan for a $${budget} budget.`
    )
    plan = parseJson(text)
  } catch {
    return NextResponse.json({ error: 'AI service unavailable. Try again.' }, { status: 503 })
  }

  if (!plan) return NextResponse.json({ error: 'AI returned invalid data' }, { status: 500 })

  // Save to DB
  const service = await createServiceClient()
  const { data: saved } = await service.from('budget_plans').insert({
    user_id: user.id,
    budget_amount: budget,
    goal,
    timeline_months,
    risk_tolerance,
    theme_preference: theme_preference ?? null,
    ai_plan: plan as import('@/types/database').Json,
    projected_return: (plan as { projected_return?: number }).projected_return ?? null,
    projected_roi_percent: (plan as { projected_roi_percent?: number }).projected_roi_percent ?? null,
  }).select().single()

  return NextResponse.json({ plan, id: saved?.id })
}
