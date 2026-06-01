import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*, lego_set:lego_sets(name, set_number, image_url, bricklink_avg_price)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ alerts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const isPro = profile?.subscription_tier !== 'free'

  if (!isPro) {
    return NextResponse.json({ error: 'Price alerts require Pro subscription.', upgrade: true }, { status: 403 })
  }

  const isDealScanner = profile?.subscription_tier === 'deal_scanner'
  if (!isDealScanner) {
    const { count } = await supabase
      .from('price_alerts')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_triggered', false)
    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: 'Pro plan limited to 10 active alerts. Upgrade to Deal Scanner for unlimited.', upgrade: true }, { status: 403 })
    }
  }

  const body = await request.json()
  const { set_id, target_price, alert_when } = body as { set_id: number; target_price: number; alert_when: string }

  const service = await createServiceClient()
  const { data, error } = await service.from('price_alerts').insert({
    user_id: user.id,
    set_id,
    target_price,
    alert_when: alert_when ?? 'below',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('price_alerts').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
