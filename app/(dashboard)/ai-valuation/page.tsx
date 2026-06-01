'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

interface ValuationResult {
 identified: boolean
 set_number: string | null
 set_name: string | null
 confidence: string
 condition_estimate: string
 estimated_value_low: number
 estimated_value_high: number
 recommendation: 'sell_now' | 'hold' | 'buy_more'
 recommendation_reason: string
 completeness_notes: string
 setData?: {
 name: string
 set_number: string
 theme: string | null
 image_url: string | null
 bricklink_avg_price: number | null
 retail_price: number | null
 is_retired: boolean
 flip_score: number | null
 } | null
 limitReached?: boolean
}

const REC_COLORS: Record<string, string> = {
 sell_now: 'bg-green-50 text-green-700 border-green-200',
 hold: 'bg-yellow-50 text-yellow-700 border-yellow-200',
 buy_more: 'bg-blue-50 text-blue-700 border-blue-200',
}

const REC_LABELS: Record<string, string> = {
 sell_now: ' Sell Now',
 hold: ' Hold',
 buy_more: ' Buy More',
}

export default function AIValuationPage() {
 const [preview, setPreview] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [result, setResult] = useState<ValuationResult | null>(null)
 const [error, setError] = useState<string | null>(null)

 const onDrop = useCallback((acceptedFiles: File[]) => {
 const file = acceptedFiles[0]
 if (!file) return
 const reader = new FileReader()
 reader.onload = () => setPreview(reader.result as string)
 reader.readAsDataURL(file)
 setResult(null)
 setError(null)
 }, [])

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
 accept: { 'image/*': [] },
 maxFiles: 1,
 onDrop,
 })

 async function analyze() {
 if (!preview) return
 setLoading(true)
 setError(null)

 const [header, base64] = preview.split(',')
 const mime = header.match(/data:(.*);/)?.[1] ?? 'image/jpeg'

 const res = await fetch('/api/ai/photo-price', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ image_base64: base64, mime_type: mime }),
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
 <h1 className="text-2xl font-bold">Photo-to-Price™</h1>
 <p className="text-gray-500 text-sm">Snap or upload any LEGO photo for instant AI identification and valuation.</p>
 </div>

 {/* Upload zone */}
 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
 <div
 {...getRootProps()}
 className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brick bg-brick/5' : 'border-gray-200 hover:border-gray-300'}`}
 >
 <input {...getInputProps()} />
 {preview ? (
 <div className="relative inline-block">
 <Image src={preview} alt="Preview" width={240} height={240} className="rounded-xl object-contain max-h-60 mx-auto" />
 <button
 type="button"
 onClick={e => { e.stopPropagation(); setPreview(null); setResult(null) }}
 className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-xs text-gray-500 hover:text-red-500"
 ></button>
 </div>
 ) : (
 <>
 <div className="text-5xl mb-3"></div>
 <p className="text-gray-500 font-medium">Drop a LEGO photo here</p>
 <p className="text-gray-400 text-sm mt-1">or click to browse · JPEG, PNG, WebP</p>
 </>
 )}
 </div>

 {preview && (
 <button
 onClick={analyze}
 disabled={loading}
 className="w-full bg-brick hover:bg-brick-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
 >
 {loading ? ' Analyzing photo…' : ' Identify & Value This Set'}
 </button>
 )}

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
 <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
 {result.identified && result.set_name ? (
 <>
 <div className="flex items-start gap-4">
 {result.setData?.image_url && (
 <Image src={result.setData.image_url} alt={result.set_name} width={80} height={80} className="w-20 h-20 rounded-xl object-contain bg-surface p-1" />
 )}
 <div className="flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <h2 className="font-bold text-lg">{result.set_name}</h2>
 {result.set_number && <span className="text-xs text-gray-400">#{result.set_number}</span>}
 <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${result.confidence === 'high' ? 'bg-green-50 text-green-600' : result.confidence === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
 {result.confidence} confidence
 </span>
 </div>
 <div className="text-sm text-gray-500 mt-1">{result.condition_estimate.replace(/_/g, ' ')}</div>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg text-text-main">{formatCurrency(result.estimated_value_low)} – {formatCurrency(result.estimated_value_high)}</div>
 <div className="text-xs text-gray-400">AI Valuation Range</div>
 </div>
 {result.setData?.bricklink_avg_price && (
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg">{formatCurrency(result.setData.bricklink_avg_price)}</div>
 <div className="text-xs text-gray-400">BrickLink Avg</div>
 </div>
 )}
 {result.setData?.flip_score && (
 <div className="bg-surface rounded-xl p-3 text-center">
 <div className="font-black text-lg text-brick">{result.setData.flip_score}</div>
 <div className="text-xs text-gray-400">Flip Score</div>
 </div>
 )}
 </div>

 <div className={`border rounded-xl p-4 ${REC_COLORS[result.recommendation]}`}>
 <div className="font-bold text-sm mb-1">{REC_LABELS[result.recommendation]}</div>
 <p className="text-sm">{result.recommendation_reason}</p>
 </div>

 {result.completeness_notes && (
 <div className="text-sm text-gray-600 bg-surface rounded-xl p-3">
 <span className="font-medium">Notes: </span>{result.completeness_notes}
 </div>
 )}
 </>
 ) : (
 <div className="text-center py-8">
 <div className="text-4xl mb-3"></div>
 <h3 className="font-semibold">Couldn&apos;t identify this set</h3>
 <p className="text-sm text-gray-400 mt-1">Try a clearer photo with better lighting, or include the set&apos;s box.</p>
 </div>
 )}
 </div>
 )}
 </div>
 )
}
