# BrickMarket

The LEGO community platform for collectors and resellers. Flip Score, Deal Scanner, Trade Matchmaker, Photo-to-Price, Budget Builder, and a full marketplace — all in one app.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `/supabase/schema.sql`
3. Go to **Storage** → create a public bucket called `listing-images`
4. Go to **Authentication** → **Providers** → enable Google OAuth (optional)
5. Copy your project URL and anon key into `.env.local`

### 3. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two subscription products:
   - **Pro** — $9/month → copy the Price ID to `STRIPE_PRICE_ID_PRO_MONTHLY`
   - **Deal Scanner** — $12/month → copy the Price ID to `STRIPE_PRICE_ID_DEAL_SCANNER`
3. Copy your secret key and publishable key into `.env.local`
4. Set up a webhook endpoint at `https://yourapp.vercel.app/api/stripe/webhook`
   - Add these events: `payment_intent.succeeded`, `customer.subscription.updated`, `customer.subscription.created`, `customer.subscription.deleted`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Set up Anthropic (Claude AI)

1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env.local` as `ANTHROPIC_API_KEY`

### 5. Set up Resend (email)

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Add API key to `.env.local` as `RESEND_API_KEY`
4. Update the `FROM` address in `lib/resend.ts` to your verified domain

### 6. Set up Twilio (SMS — optional)

1. Create an account at [twilio.com](https://twilio.com)
2. Get a phone number
3. Add credentials to `.env.local`

### 7. Set up RapidAPI (Deal Scanner — optional)

1. Get a key from [rapidapi.com](https://rapidapi.com)
2. Subscribe to the Facebook Marketplace Scraper API
3. Add to `.env.local` as `RAPIDAPI_KEY`

### 8. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 9. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in Vercel's project settings
4. Add `CRON_SECRET` env var (any random string) — used to secure cron endpoints
5. Deploy!

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | Stripe Price ID for Pro plan |
| `STRIPE_PRICE_ID_DEAL_SCANNER` | Stripe Price ID for Deal Scanner plan |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY` | Same as above (client-side) |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_DEAL_SCANNER` | Same as above (client-side) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `RESEND_API_KEY` | Resend email API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (E.164 format) |
| `RAPIDAPI_KEY` | RapidAPI key for Facebook Marketplace scraper |
| `CRON_SECRET` | Secret token for securing cron job endpoints |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. https://brickmarket.app) |

---

## Features

| Feature | Tier | Description |
|---|---|---|
| Marketplace | Free | Buy, sell, list LEGO sets with Stripe payments |
| Portfolio | Free (20 sets) / Pro (unlimited) | Track your collection with cost basis and current value |
| Flip Score™ | Free (3/mo) / Pro (unlimited) | AI-powered 1–100 investment score per set |
| Photo-to-Price | Free (3/mo) / Pro (unlimited) | Upload a photo, get instant AI valuation |
| Leaderboard | Free | Submit flips, compete weekly for top ROI |
| Trade Matchmaker | Pro | Post what you have/want, get auto-matched |
| Budget Builder | Pro | AI investment plan for your specific budget |
| Price Alerts | Pro (10 max) / Deal Scanner (unlimited) | Alert when a set hits your target price |
| Deal Scanner | Deal Scanner only | Auto-scan Facebook Marketplace + SMS/email alerts |

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** Stripe (subscriptions + Connect for seller payouts)
- **AI:** Anthropic Claude (Flip Score, Photo-to-Price, Budget Builder, Deal analysis)
- **Email:** Resend
- **SMS:** Twilio
- **Deployment:** Vercel (with cron jobs)
