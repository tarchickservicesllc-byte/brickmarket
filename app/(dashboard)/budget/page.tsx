'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

const GOALS = [
 { value: 'flip_profit', label: 'Flip for Profit', desc: 'Buy low, sell high quickly', icon: '' },
 { value: 'long_term_hold', label: 'Long-Term Hold', desc: 'Buy retired sets and wait for appreciation', icon: '' },
 { value: 'theme_collection', label: 'Theme Collection', desc: 'Build a focused collection in one theme', icon: '' },
]

const RISK_LEVELS = [
 { value: 'conservative', label: 'Conservative', desc: 'Safe bets, proven performers' },
 { value: 'moderate', label: 'Moderate', desc: 'Balanced mix of safe and speculative' },
 { value: 'aggressive', label: 'Aggressive', desc: 'Higher risk, higher potential ROI' },
]

interface PurchaseItem {
 set_number: string
 set_name: string
 theme: string
 quantity: number
 estimated_buy_price: number
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

export default function BudgetPage() {
 const [step, setStep] = useState(1)
 const [budget, setBudget] = useState(500)
 const [goal, setGoal] = useState('flip_profit')
 const [months, setMonths] = useState(12)
 const [risk, setRisk] = useState('moderate')
 const [theme, setTheme] = useState('')
 const [loading, setLoading] = useState(false)
 const [plan, setPlan] = useState<Plan | null>(null)
 const [error, setError] = useState<string | null>(null)

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
 }

 const riskColor = (r: string) => r === 'low' ? 'text-green-600' : r === 'medium' ? 'text-yellow-600' : 'text-red-500'

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 <div>
 <h1 className="text-2xl font-bold">Budget Builder</h1>
 <p className="text-gray-500 text-sm">Get a personalized AI investment plan for your LEGO budget.</p>
 </div>

 {step < 6 && (
 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
 {/* Progress */}
 <div className="flex gap-1">
 {[1,2,3,4,5].map(s => (
 <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brick' : 'bg-gray-100'}`} />
 ))}
 </div>

 {step === 1 && (
 <div className="space-y-4">
 <h2 className="font-bold">What&apos;s your budget?</h2>
 <div className="text-4xl font-black text-brick">{formatCurrency(budget)}</div>
 <input type="range" min="50" max="5000" step="50" value={budget} onChange={e => setBudget(parseInt(e.target.value))} className="w-full accent-brick" />
 <div className="flex justify-between text-xs text-gray-400"><span>$50</span><span>$5,000</span></div>
 </div>
 )}

 {step === 2 && (
 <div className="space-y-4">
 <h2 className="font-bold">What&apos;s your goal?</h2>
 <div className="space-y-2">
 {GOALS.map(g => (
 <button key={g.value} onClick={() => setGoal(g.value)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${goal === g.value ? 'border-brick bg-brick/5' : 'border-gray-100 hover:border-gray-200'}`}>
 <span className="text-2xl">{g.icon}</span>
 <div>
 <div className="font-semibold">{g.label}</div>
 <div className="text-sm text-gray-400">{g.desc}</div>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {step === 3 && (
 <div className="space-y-4">
 <h2 className="font-bold">Investment timeline</h2>
 <div className="text-3xl font-black text-brick">{months} months</div>
 <input type="range" min="3" max="36" step="3" value={months} onChange={e => setMonths(parseInt(e.target.value))} className="w-full accent-brick" />
 <div className="flex justify-between text-xs text-gray-400"><span>3 months</span><span>36 months</span></div>
 </div>
 )}

 {step === 4 && (
 <div className="space-y-4">
 <h2 className="font-bold">Risk tolerance</h2>
 <div className="space-y-2">
 {RISK_LEVELS.map(r => (
 <button key={r.value} onClick={() => setRisk(r.value)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${risk === r.value ? 'border-brick bg-brick/5' : 'border-gray-100 hover:border-gray-200'}`}>
 <div>
 <div className="font-semibold">{r.label}</div>
 <div className="text-sm text-gray-400">{r.desc}</div>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {step === 5 && (
 <div className="space-y-4">
 <h2 className="font-bold">Theme preference (optional)</h2>
 <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g. Star Wars, Icons, Harry Potter…" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" />
 <p className="text-xs text-gray-400">Leave blank for the AI to pick the best opportunities across all themes.</p>
 </div>
 )}

 <div className="flex gap-2">
 {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex-1 border border-gray-200 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50">← Back</button>}
 {step < 5 ? (
 <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-brick hover:bg-brick-dark text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Next →</button>
 ) : (
 <button onClick={generate} disabled={loading} className="flex-1 bg-brick hover:bg-brick-dark text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
 {loading ? ' Building your plan…' : ' Generate Plan'}
 </button>
 )}
 </div>

 {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
 </div>
 )}

 {/* Results */}
 {plan && (
 <div className="space-y-4">
 <div className="bg-white rounded-2xl border border-gray-100 p-6">
 <div className="flex items-start justify-between mb-3">
 <h2 className="font-bold text-lg">Your Investment Plan</h2>
 <button onClick={() => { setPlan(null); setStep(1) }} className="text-xs text-gray-400 hover:text-gray-600">Start over</button>
 </div>
 <p className="text-sm text-gray-600 mb-4">{plan.summary}</p>
 <div className="grid grid-cols-3 gap-3">
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg">{formatCurrency(plan.total_budget_used)}</div>
 <div className="text-xs text-gray-400">Budget Used</div>
 </div>
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg text-green-600">{formatCurrency(plan.projected_return)}</div>
 <div className="text-xs text-gray-400">Projected Return</div>
 </div>
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg text-brick">+{plan.projected_roi_percent?.toFixed(0)}%</div>
 <div className="text-xs text-gray-400">Projected ROI</div>
 </div>
 </div>
 </div>

 {plan.purchases?.map((item, i) => (
 <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
 <div className="flex items-start justify-between mb-2">
 <div>
 <h3 className="font-bold">{item.set_name} <span className="text-gray-400 font-normal text-sm">#{item.set_number}</span></h3>
 <div className="text-xs text-gray-400 mt-0.5">{item.theme} · Qty: {item.quantity}</div>
 </div>
 <span className={`text-xs font-semibold ${riskColor(item.risk)}`}>{item.risk} risk</span>
 </div>
 <p className="text-sm text-gray-600 mb-3">{item.reason}</p>
 <div className="grid grid-cols-2 gap-2 text-sm">
 <div className="bg-surface rounded-lg p-2">
 <div className="text-gray-400 text-xs">Buy for</div>
 <div className="font-semibold">{formatCurrency(item.estimated_buy_price)}</div>
 <div className="text-xs text-gray-400">{item.where_to_buy}</div>
 </div>
 <div className="bg-surface rounded-lg p-2">
 <div className="text-gray-400 text-xs">Sell for</div>
 <div className="font-semibold text-green-600">{formatCurrency(item.projected_sell_price)}</div>
 <div className="text-xs text-gray-400">by {item.hold_until}</div>
 </div>
 </div>
 <div className="mt-2 text-xs text-gray-400">Projected ROI: <span className="text-green-600 font-semibold">+{item.projected_roi?.toFixed(0)}%</span></div>
 </div>
 ))}

 {(plan.warnings?.length > 0 || plan.timing_advice || plan.strategy_notes) && (
 <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 space-y-2 text-sm">
 {plan.warnings?.map((w, i) => (
 <div key={i} className="flex gap-2"><span></span><span>{w}</span></div>
 ))}
 {plan.timing_advice && <div className="flex gap-2"><span></span><span>{plan.timing_advice}</span></div>}
 {plan.strategy_notes && <div className="flex gap-2"><span></span><span>{plan.strategy_notes}</span></div>}
 </div>
 )}
 </div>
 )}
 </div>
 )
}
