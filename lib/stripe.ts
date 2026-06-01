import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  return _stripe
}

// Keep named export for backwards compat with existing imports
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const PLATFORM_FEE_PERCENT = 0.08

export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function toDollars(cents: number): number {
  return cents / 100
}
