import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPurchaseConfirmation, sendSaleNotification } from '@/lib/resend'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = await createServiceClient()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const listingId = pi.metadata.listing_id
    const buyerId = pi.metadata.buyer_id

    if (listingId && buyerId) {
      // Mark listing sold
      const { data: listing } = await service
        .from('listings')
        .update({ status: 'sold', buyer_id: buyerId, sold_at: new Date().toISOString(), stripe_payment_intent_id: pi.id })
        .eq('id', listingId)
        .select('*, seller:profiles!listings_seller_id_fkey(username, id), buyer:profiles!listings_buyer_id_fkey(username)')
        .single()

      // Send emails
      if (listing) {
        const { data: buyerAuth } = await service.auth.admin.getUserById(buyerId)
        const { data: sellerAuth } = await service.auth.admin.getUserById(listing.seller_id)

        if (buyerAuth.user?.email) {
          await sendPurchaseConfirmation(
            buyerAuth.user.email,
            (listing.buyer as { username: string } | null)?.username ?? 'there',
            listing.title,
            listing.price,
            (listing.seller as { username: string } | null)?.username ?? 'seller'
          ).catch(console.error)
        }
        if (sellerAuth.user?.email) {
          await sendSaleNotification(
            sellerAuth.user.email,
            (listing.seller as { username: string } | null)?.username ?? 'there',
            listing.title,
            listing.price,
            (listing.buyer as { username: string } | null)?.username ?? 'buyer'
          ).catch(console.error)
        }
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const status = sub.status
    const priceId = sub.items.data[0]?.price.id

    let tier = 'free'
    if (priceId === process.env.STRIPE_PRICE_ID_DEAL_SCANNER) tier = 'deal_scanner'
    else if (priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY) tier = 'pro'

    await service
      .from('profiles')
      .update({ subscription_tier: status === 'active' ? tier : 'free', subscription_status: status })
      .eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    await service
      .from('profiles')
      .update({ subscription_tier: 'free', subscription_status: 'canceled' })
      .eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}

export const config = {
  api: { bodyParser: false },
}
