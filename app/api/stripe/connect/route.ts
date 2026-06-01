import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  let accountId = profile?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    accountId = account.id
    const service = await createServiceClient()
    await service.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?connect=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
