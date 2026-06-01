'use client'

import { useState } from 'react'
import SetSearch from '@/components/shared/SetSearch'
import FlipScoreGauge from '@/components/flip-score/FlipScoreGauge'
import type { LegoSet } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface FlipResult {
 score: number
 rating: string
 buy_signal: boolean
 top_reason: string
 best_sell_window: string | null
 risk_level: string | null
 breakdown: Record<string, number> | null
 isPro: boolean
 cached?: boolean
 limitReached?: boolean
}

export default function IntelPage() {
 const [selectedSet, setSelectedSet] = useState<LegoSet | null>(null)
 const [loading, setLoading] = useState(false)
 const [result, setResult] = useState<FlipResult | null>(null)
 const [error, setError] = useState<string | null>(null)

 async function runFlipScore() {
 if (!selectedSet) return
 setLoading(true)
 setResult(null)
 setError(null)
 const res = await fetch('/api/ai/flip-score', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ set_number: selectedSet.set_number }),
 })
 const data = await res.json()
 setLoading(false)
 if (!res.ok) {
 setError(data.error)
 return
 }
 setResult(data)
 }

 return (
 <div className="max-w-2xl mx-auto space-y-6">
 <div>
 <h1 className="text-2xl font-bold">Price Intelligence</h1>
 <p className="text-gray-500 text-sm">Get an AI-powered Flip Score for any LEGO set.</p>
 </div>

 {/* Search */}
 <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
 <label className="block text-sm font-medium">Search a LEGO Set</label>
 <SetSearch onSelect={set => { setSelectedSet(set); setResult(null); setError(null) }} />
 {selectedSet && (
 <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
 {selectedSet.image_url && <Image src={selectedSet.image_url} alt={selectedSet.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />}
 <div className="flex-1">
 <div className="font-semibold text-sm">{selectedSet.name}</div>
 <div className="text-xs text-gray-400">#{selectedSet.set_number} · {selectedSet.theme} · {selectedSet.is_retired ? ' Retired' : ' Available'}</div>
 </div>
 <div className="text-right text-sm">
 <div className="font-medium">{selectedSet.retail_price ? formatCurrency(selectedSet.retail_price) : '—'}</div>
 <div className="text-xs text-gray-400">Retail</div>
 </div>
 </div>
 )}
 <button
 onClick={runFlipScore}
 disabled={!selectedSet || loading}
 className="w-full bg-brick hover:bg-brick-dark disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors"
 >
 {loading ? ' Analyzing…' : ' Get Flip Score'}
 </button>
 {error && (
 <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
 {error}
 {error.includes('Upgrade') && (
 <a href="/settings?upgrade=1" className="ml-2 font-semibold underline">Upgrade now →</a>
 )}
 </div>
 )}
 </div>

 {/* Result */}
 {result && (
 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
 {result.cached && <div className="text-xs text-gray-400 text-right">Cached result</div>}
 <div className="flex items-center justify-between">
 <div>
 <h2 className="font-bold text-lg">{selectedSet?.name}</h2>
 <div className="flex items-center gap-2 mt-1">
 {result.buy_signal && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold"> Buy Signal</span>}
 {result.risk_level && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${result.risk_level === 'low' ? 'bg-green-50 text-green-600' : result.risk_level === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
 {result.risk_level} risk
 </span>}
 </div>
 </div>
 <FlipScoreGauge score={result.score} size={120} />
 </div>

 <div className="bg-surface rounded-xl p-4 text-sm text-gray-700">
 <span className="font-semibold">Top reason: </span>{result.top_reason}
 </div>

 {result.isPro && result.best_sell_window && (
 <div className="flex items-center gap-2 text-sm">
 <span className="text-2xl"></span>
 <div>
 <span className="font-medium">Best sell window: </span>
 <span className="text-gray-600">{result.best_sell_window}</span>
 </div>
 </div>
 )}

 {result.isPro && result.breakdown && (
 <div>
 <h3 className="text-sm font-semibold mb-3">Score Breakdown</h3>
 <div className="space-y-2">
 {Object.entries(result.breakdown).map(([key, val]) => (
 <div key={key} className="flex items-center gap-3">
 <span className="text-xs text-gray-500 capitalize w-24">{key}</span>
 <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
 <div className="h-full bg-brick rounded-full transition-all" style={{ width: `${val}%` }} />
 </div>
 <span className="text-xs font-semibold w-8 text-right">{val}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {!result.isPro && (
 <div className="bg-brick/5 border border-brick/20 rounded-xl p-4 text-sm text-center">
 <div className="text-brick font-semibold mb-1">Upgrade to Pro for full breakdown</div>
 <p className="text-gray-500 text-xs mb-3">See the full AI reasoning, sell window, risk level, and 5-factor breakdown.</p>
 <a href="/settings?upgrade=1" className="bg-brick text-white font-semibold px-5 py-2 rounded-lg text-xs inline-block hover:bg-brick-dark transition-colors">Upgrade to Pro — $9/mo</a>
 </div>
 )}
 </div>
 )}

 {/* Set stats */}
 {selectedSet && !loading && (
 <div className="bg-white rounded-2xl border border-gray-100 p-5">
 <h3 className="font-semibold mb-3">Market Data</h3>
 <div className="grid grid-cols-2 gap-3 text-sm">
 {[
 { label: 'BrickLink Avg', value: selectedSet.bricklink_avg_price ? formatCurrency(selectedSet.bricklink_avg_price) : 'N/A' },
 { label: 'eBay Avg', value: selectedSet.ebay_avg_price ? formatCurrency(selectedSet.ebay_avg_price) : 'N/A' },
 { label: 'Retail Price', value: selectedSet.retail_price ? formatCurrency(selectedSet.retail_price) : 'N/A' },
 { label: 'Piece Count', value: selectedSet.piece_count?.toLocaleString() ?? 'N/A' },
 { label: 'Year', value: selectedSet.year_released?.toString() ?? 'N/A' },
 { label: 'Status', value: selectedSet.is_retired ? 'Retired' : 'Active' },
 ].map(stat => (
 <div key={stat.label} className="flex justify-between">
 <span className="text-gray-400">{stat.label}</span>
 <span className="font-medium">{stat.value}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
}
