import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, toCents, PLATFORM_FEE_PERCENT } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { listing_id } = body as { listing_id: string }

  type ListingWithSeller = { id: string; seller_id: string; price: number; title: string; status: string; seller: { stripe_account_id: string | null } | null }
  const { data: listing } = await supabase
    .from('listings')
    .select('*, seller:profiles!listings_seller_id_fkey(stripe_account_id)')
    .eq('id', listing_id)
    .eq('status', 'active')
    .single() as unknown as { data: ListingWithSeller | null }

  if (!listing) return NextResponse.json({ error: 'Listing not found or not available' }, { status: 404 })
  if (listing.seller_id === user.id) return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 })

  const amountCents = toCents(listing.price)
  const feeAmount = Math.round(amountCents * PLATFORM_FEE_PERCENT)

  const sellerAccountId = (listing.seller as { stripe_account_id?: string } | null)?.stripe_account_id

  const piParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: amountCents,
    currency: 'usd',
    metadata: { listing_id, buyer_id: user.id, seller_id: listing.seller_id },
    automatic_payment_methods: { enabled: true },
  }

  if (sellerAccountId) {
    piParams.application_fee_amount = feeAmount
    piParams.transfer_data = { destination: sellerAccountId }
  }

  const pi = await stripe.paymentIntents.create(piParams)

  return NextResponse.json({
    client_secret: pi.client_secret,
    payment_intent_id: pi.id,
    amount: listing.price,
    listing_title: listing.title,
  })
}
