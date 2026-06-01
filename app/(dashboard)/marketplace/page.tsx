'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, conditionLabel } from '@/lib/utils'

interface Listing {
 id: string
 title: string
 price: number
 condition: string
 images: string[]
 location: string | null
 created_at: string
 lego_set: { name: string; set_number: string; image_url: string | null } | null
 seller: { username: string; avatar_url: string | null } | null
}

export default function MarketplacePage() {
 const [listings, setListings] = useState<Listing[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState('')
 const [condition, setCondition] = useState('')
 const [page, setPage] = useState(1)
 const [total, setTotal] = useState(0)

 async function fetchListings(p = 1) {
 setLoading(true)
 const params = new URLSearchParams({ page: p.toString() })
 if (search) params.set('search', search)
 if (condition) params.set('condition', condition)
 const res = await fetch(`/api/marketplace/listings?${params}`)
 const data = await res.json()
 setListings(data.listings ?? [])
 setTotal(data.total ?? 0)
 setLoading(false)
 }

 useEffect(() => { fetchListings(1) }, [search, condition])

 return (
 <div className="space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold">Marketplace</h1>
 <p className="text-gray-500 text-sm">{total} active listings</p>
 </div>
 <Link href="/marketplace/new" className="bg-brick hover:bg-brick-dark text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
 + List a Set
 </Link>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-2">
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search listings…"
 className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30 min-w-48"
 />
 <select value={condition} onChange={e => setCondition(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
 <option value="">All conditions</option>
 {['new_sealed','used_complete','used_incomplete','parts_only'].map(c => (
 <option key={c} value={c}>{conditionLabel(c)}</option>
 ))}
 </select>
 </div>

 {/* Grid */}
 {loading ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />)}
 </div>
 ) : listings.length === 0 ? (
 <div className="text-center py-16 text-gray-400">
 <div className="text-5xl mb-3"></div>
 <p className="font-medium">No listings found</p>
 <p className="text-sm mt-1">Be the first to list something!</p>
 <Link href="/marketplace/new" className="mt-4 inline-block bg-brick text-white font-semibold px-5 py-2 rounded-lg text-sm">Create listing</Link>
 </div>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {listings.map(listing => {
 const img = listing.images?.[0] ?? listing.lego_set?.image_url
 return (
 <Link key={listing.id} href={`/marketplace/${listing.id}`} className="bg-white rounded-2xl border border-gray-100 hover:border-brick/20 hover:shadow-sm transition-all overflow-hidden">
 <div className="aspect-square bg-surface relative">
 {img ? (
 <Image src={img} alt={listing.title} fill className="object-contain p-2" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-4xl"></div>
 )}
 <div className="absolute top-2 left-2">
 <span className="text-xs bg-white/90 px-2 py-0.5 rounded-full font-medium text-gray-600">{conditionLabel(listing.condition)}</span>
 </div>
 </div>
 <div className="p-3">
 <div className="font-semibold text-sm line-clamp-2 mb-1">{listing.title}</div>
 <div className="text-xs text-gray-400 mb-2">@{listing.seller?.username} {listing.location && `· ${listing.location}`}</div>
 <div className="text-brick font-black text-lg">{formatCurrency(listing.price)}</div>
 </div>
 </Link>
 )
 })}
 </div>
 )}

 {/* Pagination */}
 {total > 20 && (
 <div className="flex items-center justify-center gap-2">
 <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchListings(page - 1) }} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">← Prev</button>
 <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
 <button disabled={page * 20 >= total} onClick={() => { setPage(p => p + 1); fetchListings(page + 1) }} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Next →</button>
 </div>
 )}
 </div>
 )
}
