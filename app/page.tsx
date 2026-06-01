import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const features = [
  {
    icon: '📊',
    title: 'Flip Score™',
    desc: 'AI-powered 1–100 score for every LEGO set. Know exactly what to buy, hold, or sell.',
  },
  {
    icon: '🔍',
    title: 'Deal Scanner',
    desc: 'Scan Facebook Marketplace for underpriced sets and get instant SMS + email alerts.',
  },
  {
    icon: '🔄',
    title: 'Trade Matchmaker',
    desc: 'List what you have and what you want. We find compatible trade partners automatically.',
  },
  {
    icon: '📸',
    title: 'Photo-to-Price',
    desc: 'Snap a photo of any LEGO set and get an instant AI valuation and sell recommendation.',
  },
  {
    icon: '💰',
    title: 'Budget Builder',
    desc: 'Tell us your budget and goals. Get a personalized LEGO investment plan from AI.',
  },
  {
    icon: '🏆',
    title: 'Flip Leaderboard',
    desc: 'Show off your best flips. Compete weekly for the top ROI on the community board.',
  },
]

const testimonials = [
  { name: 'Mike T.', handle: '@brickflip_mike', text: 'The Flip Score alone is worth the subscription. I\'ve doubled my ROI since joining BrickMarket.', avatar: 'MT' },
  { name: 'Sarah K.', handle: '@sarahbuilds', text: 'Deal Scanner texted me about a sealed Millennium Falcon for $200 at a garage sale near me. Best $12/month I\'ve ever spent.', avatar: 'SK' },
  { name: 'James R.', handle: '@jamesresells', text: 'Found 3 trade partners in my first week. Swapped a bunch of dupes for sets I actually wanted. This platform is a game changer.', avatar: 'JR' },
]

const FAKE_LEADERBOARD = [
  { username: 'brickflip_pro', set: 'LEGO Icons Eiffel Tower #10307', bought: 180, sold: 590, roi: 228 },
  { username: 'setcollector22', set: 'LEGO Ideas NES #71374', bought: 120, sold: 320, roi: 167 },
  { username: 'legoinvestor', set: 'LEGO Technic Ferrari #42143', bought: 280, sold: 680, roi: 143 },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white text-text-main">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-brick">🧱 BrickMarket</span>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="bg-brick hover:bg-brick-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Sign in</Link>
                <Link href="/signup" className="bg-brick hover:bg-brick-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Start free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-block bg-brick/10 text-brick text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Built by collectors, for collectors
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          The smarter way to<br />
          <span className="text-brick">invest in LEGO</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Flip Score, Deal Scanner, Trade Matchmaker, AI Valuation — everything a serious LEGO reseller needs in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="bg-brick hover:bg-brick-dark text-white font-bold px-8 py-3.5 rounded-xl text-lg transition-colors">
            Start free — no credit card
          </Link>
          <Link href="#features" className="border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors">
            See features
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Free forever plan • Pro from $9/mo • Deal Scanner $12/mo</p>
      </section>

      {/* Flip Score Demo */}
      <section className="bg-surface py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-brick uppercase tracking-wider mb-3">Flip Score™</p>
          <h2 className="text-3xl font-bold mb-4">Know what to buy before you buy it</h2>
          <p className="text-gray-500 mb-10">Our AI analyzes retirement status, theme demand, price history, and seasonal timing to score every LEGO set from 1–100.</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { name: 'Eiffel Tower #10307', score: 87, label: 'Strong Flip' },
              { name: 'Millennium Falcon #75192', score: 94, label: 'Exceptional' },
              { name: 'Rivendell #10316', score: 78, label: 'Strong Flip' },
            ].map(s => (
              <div key={s.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center w-44">
                <div className={`text-5xl font-black mb-1 ${s.score >= 70 ? 'text-green-500' : s.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>{s.score}</div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</div>
                <div className="text-xs text-gray-400">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">Everything you need to flip smarter</h2>
          <p className="text-gray-500 mt-3">Six powerful tools built specifically for LEGO resellers and collectors.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-surface rounded-2xl p-6 border border-gray-100 hover:border-brick/20 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="bg-surface py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-brick uppercase tracking-wider mb-2">Community Leaderboard</p>
            <h2 className="text-3xl font-bold">Real flips from real collectors</h2>
          </div>
          <div className="space-y-3">
            {FAKE_LEADERBOARD.map((entry, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="text-2xl font-black text-gray-200 w-8">#{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{entry.set}</div>
                  <div className="text-xs text-gray-400">@{entry.username}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-black text-lg">+{entry.roi}%</div>
                  <div className="text-xs text-gray-400">${entry.bought} → ${entry.sold}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/signup" className="text-brick font-semibold hover:underline text-sm">See the full leaderboard →</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">Simple pricing</h2>
          <p className="text-gray-500 mt-2">Start free. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="font-bold text-lg mb-1">Free</div>
            <div className="text-3xl font-black mb-4">$0<span className="text-base font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {['3 Flip Score checks/month','3 Photo-to-Price scans/month','Browse marketplace','Portfolio (up to 20 sets)','View leaderboard'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-brick text-brick hover:bg-brick/5 font-semibold py-2.5 rounded-lg transition-colors text-sm">Get started free</Link>
          </div>
          {/* Pro */}
          <div className="border-2 border-brick rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brick text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</div>
            <div className="font-bold text-lg mb-1">Pro</div>
            <div className="text-3xl font-black mb-4">$9<span className="text-base font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {['Unlimited Flip Score','Unlimited Photo-to-Price','Full AI breakdown + reasoning','Unlimited portfolio','Budget Builder','Trade Matchmaker','10 price alerts'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-brick hover:bg-brick-dark text-white font-bold py-2.5 rounded-lg transition-colors text-sm">Start Pro</Link>
          </div>
          {/* Deal Scanner */}
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="font-bold text-lg mb-1">Deal Scanner</div>
            <div className="text-3xl font-black mb-4">$12<span className="text-base font-normal text-gray-400">/mo</span></div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {['Everything in Pro','Deal Scanner alerts','SMS + email notifications','Unlimited price alerts','Early access to features'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-brick text-brick hover:bg-brick/5 font-semibold py-2.5 rounded-lg transition-colors text-sm">Start Deal Scanner</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What collectors are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brick/10 text-brick text-xs font-bold flex items-center justify-center">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-extrabold mb-4">Ready to flip smarter?</h2>
        <p className="text-gray-500 mb-8">Join thousands of LEGO collectors already using BrickMarket to find deals, track flips, and grow their collection.</p>
        <Link href="/signup" className="inline-block bg-brick hover:bg-brick-dark text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors">
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-brick">🧱 BrickMarket</span>
          <div className="flex gap-6">
            <Link href="/marketplace" className="hover:text-gray-600">Marketplace</Link>
            <Link href="/leaderboard" className="hover:text-gray-600">Leaderboard</Link>
            <Link href="#pricing" className="hover:text-gray-600">Pricing</Link>
            <Link href="mailto:hello@brickmarket.app" className="hover:text-gray-600">Contact</Link>
          </div>
          <span>© {new Date().getFullYear()} BrickMarket</span>
        </div>
      </footer>
    </div>
  )
}
