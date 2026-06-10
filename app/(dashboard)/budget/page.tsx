'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

const GOALS = [
  { value: 'flip_profit',      label: 'Flip for Profit',      desc: 'Buy low, sell high quickly',                    icon: '🔁' },
  { value: 'long_term_hold',   label: 'Long-Term Hold',        desc: 'Buy retiring sets and wait for appreciation',   icon: '📈' },
  { value: 'theme_collection', label: 'Theme Collection',      desc: 'Build a focused collection in one theme',       icon: '🧱' },
]

const RISK_LEVELS = [
  { value: 'conservative', label: 'Conservative', desc: 'Safe bets, proven performers' },
  { value: 'moderate',     label: 'Moderate',     desc: 'Balanced mix of safe and speculative' },
  { value: 'aggressive',   label: 'Aggressive',   desc: 'Higher risk, higher potential ROI' },
]

interface PurchaseItem {
  set_number: string
  set_name: string
  theme: string
  quantity: number
  retail_price?: number
  market_resale_price?: number
  estimated_buy_price: number
  price_data_source?: string
  is_retired?: boolean
  where_to_buy: string
  reason: string
  hold_until: string
  projected_sell_price: number
  projected_roi: number
  risk: string
}

interface Plan {
  summary: string
  total_budget_used: number
  projected_return: number
  projected_roi_percent: number
  confidence: string
  purchases: PurchaseItem[]
  strategy_notes: string
  timing_advice: string
  warnings: string[]
}

const SESSION_KEY = 'budget_builder_plan'

function BudgetBuilderInner() {
  const router = useRouter()
  const params = useSearchParams()

  const [step,   setStep]   = useState(1)
  const [budget, setBudget] = useState(() => parseInt(params.get('budget') ?? '500'))
  const [goal,   setGoal]   = useState(() => params.get('goal') ?? 'flip_profit')
  const [months, setMonths] = useState(() => parseInt(params.get('months') ?? '12'))
  const [risk,   setRisk]   = useState(() => params.get('risk') ?? 'moderate')
  const [theme,  setTheme]  = useState(() => params.get('theme') ?? '')
  const [loading, setLoading] = useState(false)
  const [plan,   setPlan]   = useState<Plan | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  useEffect(() => {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached && params.get('plan') === '1') {
      try { setPlan(JSON.parse(cached)); setStep(6) } catch { /* ignore */ }
    }
  }, [])

  const syncUrl = useCallback((b: number, g: string, m: number, r: string, t: string, hasPlan = false) => {
    const p = new URLSearchParams()
    p.set('budget', b.toString())
    p.set('goal', g)
    p.set('months', m.toString())
    p.set('risk', r)
    if (t) p.set('theme', t)
    if (hasPlan) p.set('plan', '1')
    router.replace(`/budget?${p.toString()}`, { scroll: false })
  }, [router])

  useEffect(() => { syncUrl(budget, goal, months, risk, theme, !!plan) }, [budget, goal, months, risk, theme, plan])

  async function generate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/ai/budget-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, goal, timeline_months: months, theme_preference: theme || null, risk_tolerance: risk }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error)
      if (data.upgrade) window.location.href = '/settings?upgrade=1'
      return
    }
    setPlan(data.plan)
    setStep(6)
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.plan)) } catch { /* ignore */ }
  }

  function startOver() {
    setPlan(null)
    setStep(1)
    sessionStorage.removeItem(SESSION_KEY)
    syncUrl(budget, goal, months, risk, theme, false)
  }

  const riskColor = (r: string) => r === 'low' ? 'text-emerald-400' : r === 'medium' ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Budget Builder</h1>
        <p className="text-slate-400 text-sm">Get a personalized investment plan built on live market data and price analysis.</p>
      </div>

      {step < 6 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-6">
          {/* Progress */}
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-slate-700'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">What&apos;s your budget?</h2>
              <div className="text-4xl font-black text-blue-400">{formatCurrency(budget)}</div>
              <input type="range" min="50" max="5000" step="50" value={budget}
                onChange={e => setBudget(parseInt(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-500"><span>$50</span><span>$5,000</span></div>
              <div className="flex gap-2 flex-wrap">
                {[500, 1000, 2500, 5000].map(v => (
                  <button key={v} onClick={() => setBudget(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${budget === v ? 'border-blue-500 bg-blue-950/40 text-blue-300' : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">What&apos;s your goal?</h2>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <button key={g.value} onClick={() => setGoal(g.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${goal === g.value ? 'border-blue-500 bg-blue-950/30' : 'border-slate-700 hover:border-slate-600'}`}>
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-100">{g.label}</div>
                      <div className="text-sm text-slate-400">{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">Investment timeline</h2>
              <div className="text-3xl font-black text-blue-400">{months} months</div>
              <input type="range" min="3" max="36" step="3" value={months}
                onChange={e => setMonths(parseInt(e.target.value))}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-slate-500"><span>3 months</span><span>36 months</span></div>
              <div className="flex gap-2 flex-wrap">
                {[6, 12, 18, 24, 36].map(v => (
                  <button key={v} onClick={() => setMonths(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${months === v ? 'border-blue-500 bg-blue-950/40 text-blue-300' : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                    {v}mo
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">Risk tolerance</h2>
              <div className="space-y-2">
                {RISK_LEVELS.map(r => (
                  <button key={r.value} onClick={() => setRisk(r.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${risk === r.value ? 'border-blue-500 bg-blue-950/30' : 'border-slate-700 hover:border-slate-600'}`}>
                    <div>
                      <div className="font-semibold text-slate-100">{r.label}</div>
                      <div className="text-sm text-slate-400">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-100">Theme preference <span className="font-normal text-slate-500">(optional)</span></h2>
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)}
                placeholder="e.g. Star Wars, Icons, Harry Potter…"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              <p className="text-xs text-slate-500">Leave blank to surface the best opportunities across all themes.</p>
              <div className="flex gap-2 flex-wrap">
                {['Star Wars', 'Icons', 'Technic', 'Harry Potter', 'Creator Expert'].map(t => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${theme === t ? 'border-blue-500 bg-blue-950/40 text-blue-300' : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-slate-600 text-slate-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-700 transition-colors">
                ← Back
              </button>
            )}
            {step < 5 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                Next →
              </button>
            ) : (
              <button onClick={generate} disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
                {loading ? '⏳ Building your plan…' : '🚀 Generate Plan'}
              </button>
            )}
          </div>

          {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 p-3 rounded-lg">{error}</div>}
        </div>
      )}

      {step < 6 && (
        <p className="text-xs text-center text-slate-500">
          Your inputs are saved in the URL — refresh or share and everything stays.
        </p>
      )}

      {/* Results */}
      {plan && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-bold text-lg text-slate-100">Your Investment Plan</h2>
              <button onClick={startOver} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Start over</button>
            </div>
            <p className="text-sm text-slate-300 mb-4">{plan.summary}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 rounded-xl p-3 text-center">
                <div className="font-black text-lg text-slate-100">{formatCurrency(plan.total_budget_used)}</div>
                <div className="text-xs text-slate-500">Budget Used</div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-center">
                <div className="font-black text-lg text-emerald-400">{formatCurrency(plan.projected_return)}</div>
                <div className="text-xs text-slate-500">Projected Return</div>
              </div>
              <div className="bg-slate-900 rounded-xl p-3 text-center">
                <div className="font-black text-lg text-blue-400">+{plan.projected_roi_percent?.toFixed(0)}%</div>
                <div className="text-xs text-slate-500">Projected ROI</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 text-center">
              Confidence: <span className="font-medium capitalize text-slate-300">{plan.confidence?.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {plan.purchases?.map((item, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-100">{item.set_name} <span className="text-slate-500 font-normal text-sm">#{item.set_number}</span></h3>
                  <div className="text-xs text-slate-500 mt-0.5">{item.theme} · Qty: {item.quantity} · {item.is_retired ? '🔴 Retired' : '🟢 Active'}</div>
                </div>
                <span className={`text-xs font-semibold ${riskColor(item.risk)}`}>{item.risk} risk</span>
              </div>
              <p className="text-sm text-slate-300 mb-3">{item.reason}</p>

              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Retail Price</div>
                  <div className="font-semibold text-slate-100">{item.retail_price ? formatCurrency(item.retail_price) : '—'}</div>
                  <div className="text-xs text-slate-500">{item.is_retired ? 'Orig. MSRP' : 'In stores now'}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-2">
                  <div className="text-slate-500 text-xs">Market Value</div>
                  <div className="font-semibold text-blue-400">{item.market_resale_price ? formatCurrency(item.market_resale_price) : '—'}</div>
                  <div className="text-xs text-slate-500">{item.is_retired ? 'BrickLink avg' : 'Current resale'}</div>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2">
                  <div className="text-emerald-400 text-xs font-semibold">Target Buy Price</div>
                  <div className="font-bold text-emerald-300">{formatCurrency(item.estimated_buy_price)}</div>
                  <div className="text-xs text-emerald-500">{item.where_to_buy}</div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-2 text-sm flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-xs">Sell target · {item.hold_until}</div>
                  <div className="font-semibold text-emerald-400">{formatCurrency(item.projected_sell_price)}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-xs">Projected ROI</div>
                  <div className="font-bold text-emerald-400">+{item.projected_roi?.toFixed(0)}%</div>
                </div>
              </div>

              {item.price_data_source && (
                <div className={`text-xs px-2 py-1 rounded-lg mt-2 inline-block font-medium ${item.price_data_source.includes('Retail Only') ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40' : 'bg-blue-950/40 text-blue-400 border border-blue-800/40'}`}>
                  Source: {item.price_data_source}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">Prices are estimates based on market data and are not guaranteed.</p>
            </div>
          ))}

          {(plan.warnings?.length > 0 || plan.timing_advice || plan.strategy_notes) && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-5 space-y-2 text-sm text-amber-300">
              {plan.warnings?.map((w, i) => (
                <div key={i} className="flex gap-2"><span>⚠️</span><span>{w}</span></div>
              ))}
              {plan.timing_advice && <div className="flex gap-2"><span>⏰</span><span>{plan.timing_advice}</span></div>}
              {plan.strategy_notes && <div className="flex gap-2"><span>📋</span><span>{plan.strategy_notes}</span></div>}
            </div>
          )}

          <p className="text-xs text-slate-500 text-center pb-2">
            Investment plans are generated by AI for informational purposes only. Nothing here is financial advice. Past performance does not guarantee future results. Always do your own research before purchasing.
          </p>
        </div>
      )}
    </div>
  )
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto space-y-4">{[1,2,3].map(i=><div key={i} className="h-32 bg-slate-800 rounded-2xl animate-pulse"/>)}</div>}>
      <BudgetBuilderInner />
    </Suspense>
  )
}
