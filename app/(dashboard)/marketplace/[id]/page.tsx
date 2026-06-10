'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, conditionLabel } from '@/lib/utils'
import { toast } from 'sonner'

interface ListingDetail {
  id: string
  title: string
  description: string | null
  price: number
  condition: string
  images: string[]
  location: string | null
  is_trade_ok: boolean
  trade_wants: string | null
  status: string
  created_at: string
  seller_id: string
  seller: { id: string; username: string; avatar_url: string | null; created_at: string } | null
  lego_set: { name: string; set_number: string; theme: string | null; image_url: string | null; bricklink_avg_price: number | null; retail_price: number | null } | null
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user?.id ?? null)

      const { data } = await supabase
        .from('listings')
        .select('*, seller:profiles!listings_seller_id_fkey(*), lego_set:lego_sets(*)')
        .eq('id', id as string)
        .single()
      setListing(data as unknown as ListingDetail)
      setLoading(false)

      // Increment views
      const currentViews = (data as { views?: number } | null)?.views ?? 0
      supabase.from('listings').update({ views: currentViews + 1 }).eq('id', id as string).then(() => {})
    }
    load()
  }, [id])

  async function sendMessage() {
    if (!message.trim() || !listing) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sign in to send messages'); setSending(false); return }
    const { error } = await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: user.id,
      recipient_id: listing.seller_id,
      body: message,
    })
    setSending(false)
    if (error) { toast.error('Failed to send'); return }
    toast.success('Message sent!')
    setMessage('')
  }

  async function buyNow() {
    if (!listing) return
    const res = await fetch('/api/marketplace/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Payment initiated! (Stripe integration — add client-side Elements for full checkout)')
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-80 bg-gray-100 rounded-2xl"/><div className="h-8 bg-gray-100 rounded w-1/2"/></div>
  if (!listing) return <div className="text-center py-20 text-gray-400"><p>Listing not found.</p><Link href="/marketplace" className="text-brick mt-3 inline-block hover:underline">← Back to marketplace</Link></div>

  const images = listing.images?.length ? listing.images : listing.lego_set?.image_url ? [listing.lego_set.image_url] : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/marketplace" className="text-sm text-gray-400 hover:text-gray-600">← Back to marketplace</Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-2">
          <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative">
            {images[activeImg] ? (
              <Image src={images[activeImg]} alt={listing.title} fill className="object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🧱</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-brick' : 'border-transparent'}`}>
                  <Image src={img} alt="" width={56} height={56} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            {listing.lego_set && (
              <div className="text-xs text-gray-400 mb-1">#{listing.lego_set.set_number} · {listing.lego_set.theme}</div>
            )}
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <div className="text-3xl font-black text-brick mt-2">{formatCurrency(listing.price)}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full font-medium">{conditionLabel(listing.condition)}</span>
            {listing.is_trade_ok && <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Trades OK</span>}
            {listing.location && <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">📍 {listing.location}</span>}
          </div>

          {listing.lego_set?.bricklink_avg_price && (
            <div className="bg-surface rounded-xl p-3 text-sm">
              <span className="text-gray-500">BrickLink avg: </span>
              <span className="font-semibold">{formatCurrency(listing.lego_set.bricklink_avg_price)}</span>
              {listing.price < listing.lego_set.bricklink_avg_price && (
                <span className="ml-2 text-green-600 font-semibold text-xs">
                  {Math.round((1 - listing.price / listing.lego_set.bricklink_avg_price) * 100)}% below avg!
                </span>
              )}
            </div>
          )}

          {listing.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
          )}

          {listing.is_trade_ok && listing.trade_wants && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Will trade for: </span>{listing.trade_wants}
            </div>
          )}

          {/* Seller */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <div className="w-9 h-9 rounded-full bg-brick/10 text-brick text-sm font-bold flex items-center justify-center">
              {listing.seller?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div className="text-sm font-medium">@{listing.seller?.username}</div>
              <div className="text-xs text-gray-400">Seller</div>
            </div>
          </div>

          {/* Actions */}
          {listing.status === 'active' && currentUser !== listing.seller_id && (
            <div className="space-y-2">
              <button onClick={buyNow} className="w-full bg-brick hover:bg-brick-dark text-white font-bold py-3 rounded-xl transition-colors">
                Buy Now — {formatCurrency(listing.price)}
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ask the seller a question…"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30"
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} disabled={sending || !message.trim()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  Send
                </button>
              </div>
            </div>
          )}

          {listing.status === 'sold' && (
            <div className="bg-red-50 text-red-600 font-semibold rounded-xl py-3 text-center text-sm">This listing has been sold</div>
          )}

          {currentUser === listing.seller_id && (
            <div className="bg-blue-50 text-blue-600 font-medium rounded-xl py-3 text-center text-sm">This is your listing</div>
          )}
        </div>
      </div>
    </div>
  )
}
