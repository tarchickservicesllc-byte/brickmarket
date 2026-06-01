import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Search, RefreshCw, Camera, DollarSign, BarChart2, CheckCircle, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: BarChart2,
    title: 'Flip Score',
    desc: 'AI-powered 1–100 score for every LEGO set. Know exactly what to buy, hold, or sell.',
  },
  {
    icon: Search,
    title: 'Deal Scanner',
    desc: 'Scan Facebook Marketplace for underpriced sets and receive instant email alerts.',
  },
  {
    icon: RefreshCw,
    title: 'Trade Matchmaker',
    desc: 'List what you have and what you want. Auto-matched with compatible trade partners.',
  },
  {
    icon: Camera,
    title: 'Photo Valuation',
    desc: 'Photograph any LEGO set and receive an instant AI valuation and recommendation.',
  },
  {
    icon: DollarSign,
    title: 'Budget Builder',
    desc: 'Set your budget and goals. Get a personalized LEGO investment plan from AI.',
  },
  {
    icon: TrendingUp,
    title: 'Flip Leaderboard',
    desc: 'Log your best flips and compete weekly for the top ROI in the community.',
  },
]

const FAKE_LEADERBOARD = [
  { username: 'collector_pro', set: 'Eiffel Tower #10307', bought: 180, sold: 590, roi: 228 },
  { username: 'settrader22', set: 'Nintendo NES #71374', bought: 120, sold: 320, roi: 167 },
  { username: 'brickinvestor', set: 'Ferrari Daytona #42143', bought: 280, sold: 680, roi: 143 },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">BrickMarket</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors">Pricing</Link>
            {user ? (
              <Link href="/dashboard" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Sign in</Link>
                <Link href="/signup" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Get started free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <TrendingUp className="w-3 h-3" />
          Built for serious LEGO resellers
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6 text-slate-900">
          The smarter way to<br />
          <span className="text-blue-700">invest in LEGO</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Flip Score, Deal Scanner, Trade Matchmaker, AI Valuation — every tool a serious LEGO reseller needs, in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors">
            See features
          </Link>
        </div>
        <p className="text-sm text-slate-400 mt-4">Free plan available · Basic from $10/mo · Pro from $20/mo</p>
      </section>

      {/* Flip Score Demo */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3">Flip Score</p>
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Know what to buy before you buy it</h2>
          <p className="text-slate-500 mb-10">Our AI analyzes retirement status, theme demand, price history, and seasonal timing to score every LEGO set from 1–100.</p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { name: 'Eiffel Tower #10307', score: 87, label: 'Strong Buy' },
              { name: 'Millennium Falcon #75192', score: 94, label: 'Exceptional' },
              { name: 'Rivendell #10316', score: 78, label: 'Strong Buy' },
            ].map(s => (
              <div key={s.name} className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-slate-200 text-center min-w-44">
                <div className={`text-5xl font-black mb-1 ${s.score >= 80 ? 'text-blue-700' : 'text-blue-500'}`}>{s.score}</div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">{s.label}</div>
                <div className="text-xs text-slate-400">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need to flip smarter</h2>
          <p className="text-slate-500 mt-3">Six powerful tools built specifically for LEGO resellers and collectors.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-2">Community Leaderboard</p>
            <h2 className="text-3xl font-bold text-slate-900">Real flips from real collectors</h2>
          </div>
          <div className="space-y-3">
            {FAKE_LEADERBOARD.map((entry, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-slate-200">
                <div className="text-2xl font-black text-slate-200 w-8 text-center">#{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-sm">{entry.set}</div>
                  <div className="text-xs text-slate-400">@{entry.username}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-700 font-black text-lg">+{entry.roi}%</div>
                  <div className="text-xs text-slate-400">${entry.bought} → ${entry.sold}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/signup" className="text-blue-700 font-semibold hover:underline text-sm">View full leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h2>
          <p className="text-slate-500 mt-2">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <div className="font-bold text-lg text-slate-900 mb-1">Free</div>
            <div className="text-3xl font-black text-slate-900 mb-4">$0<span className="text-base font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              {['3 Flip Score checks/month','3 Photo valuations/month','Browse marketplace','Portfolio (up to 20 sets)','View leaderboard'].map(f => (
                <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition-colors text-sm">Get started free</Link>
          </div>
          {/* Basic */}
          <div className="border-2 border-blue-700 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
            <div className="font-bold text-lg text-slate-900 mb-1">Basic</div>
            <div className="text-3xl font-black text-slate-900 mb-4">$10<span className="text-base font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              {['Unlimited Flip Score','Unlimited Photo valuations','Full AI breakdown','Unlimited portfolio','Budget Builder','Trade Matchmaker','10 price alerts'].map(f => (
                <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">Start Basic</Link>
          </div>
          {/* Pro */}
          <div className="border border-slate-200 rounded-2xl p-6">
            <div className="font-bold text-lg text-slate-900 mb-1">Pro</div>
            <div className="text-3xl font-black text-slate-900 mb-4">$20<span className="text-base font-normal text-slate-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              {['Everything in Basic','Deal Scanner alerts','Email notifications','Unlimited price alerts','Early access to features'].map(f => (
                <li key={f} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition-colors text-sm">Start Pro</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to flip smarter?</h2>
          <p className="text-blue-200 mb-8 text-lg">Join collectors already using BrickMarket to find deals, track flips, and grow their portfolio.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-blue-700 font-bold px-10 py-4 rounded-xl text-lg transition-colors">
            Create your free account <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-700">
            <div className="w-6 h-6 bg-blue-700 rounded flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            BrickMarket
          </Link>
          <div className="flex gap-6">
            <Link href="/marketplace" className="hover:text-slate-600 transition-colors">Marketplace</Link>
            <Link href="/leaderboard" className="hover:text-slate-600 transition-colors">Leaderboard</Link>
            <Link href="#pricing" className="hover:text-slate-600 transition-colors">Pricing</Link>
          </div>
          <span>© {new Date().getFullYear()} BrickMarket</span>
        </div>
      </footer>
    </div>
  )
}
