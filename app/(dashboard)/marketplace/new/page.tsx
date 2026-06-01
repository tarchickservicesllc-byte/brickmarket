'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import SetSearch from '@/components/shared/SetSearch'
import type { LegoSet } from '@/types/database'
import { conditionLabel } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'

export default function NewListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedSet, setSelectedSet] = useState<LegoSet | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'new_sealed',
    is_trade_ok: false,
    trade_wants: '',
    location: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 8,
    onDrop: acceptedFiles => {
      setImages(prev => [...prev, ...acceptedFiles].slice(0, 8))
    },
  })

  function update(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function onSetSelect(set: LegoSet) {
    setSelectedSet(set)
    if (!form.title) update('title', set.name)
    if (!form.price && set.bricklink_avg_price) update('price', set.bricklink_avg_price.toString())
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const urls: string[] = []
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('listing-images').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSet) { toast.error('Select a LEGO set'); return }
    if (!form.price) { toast.error('Enter a price'); return }
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setSubmitting(false); return }

    const imageUrls = await uploadImages(user.id)

    const res = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        set_id: selectedSet.id,
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        condition: form.condition,
        is_trade_ok: form.is_trade_ok,
        trade_wants: form.is_trade_ok ? form.trade_wants : null,
        images: imageUrls,
        location: form.location || null,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { toast.error(data.error); return }
    toast.success('Listing created!')
    router.push(`/marketplace/${data.listing.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Listing</h1>
        <p className="text-gray-500 text-sm">List a LEGO set for sale on the marketplace.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
        {/* Set search */}
        <div>
          <label className="block text-sm font-medium mb-1">LEGO Set *</label>
          <SetSearch onSelect={onSetSelect} />
          {selectedSet && (
            <div className="mt-2 flex items-center gap-3 p-2 bg-surface rounded-lg">
              {selectedSet.image_url && <Image src={selectedSet.image_url} alt={selectedSet.name} width={40} height={40} className="w-10 h-10 rounded object-cover" />}
              <div>
                <div className="text-sm font-medium">{selectedSet.name}</div>
                <div className="text-xs text-gray-400">#{selectedSet.set_number} · Retail: ${selectedSet.retail_price} · BrickLink avg: ${selectedSet.bricklink_avg_price}</div>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Listing Title *</label>
          <input type="text" value={form.title} onChange={e => update('title', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Photos (up to 8)</label>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brick bg-brick/5' : 'border-gray-200 hover:border-gray-300'}`}>
            <input {...getInputProps()} />
            <div className="text-2xl mb-2">📸</div>
            <p className="text-sm text-gray-500">Drag photos here or click to select</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 8 images</p>
          </div>
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image src={URL.createObjectURL(f)} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price + condition */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Price ($) *</label>
            <input type="number" step="0.01" min="1" value={form.price} onChange={e => update('price', e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Condition *</label>
            <select value={form.condition} onChange={e => update('condition', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              {['new_sealed','used_complete','used_incomplete','parts_only'].map(c => (
                <option key={c} value={c}>{conditionLabel(c)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location (optional)</label>
          <input type="text" value={form.location} onChange={e => update('location', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" placeholder="City, State" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30 resize-none" placeholder="Describe the condition, any missing pieces, box wear, etc." />
        </div>

        {/* Trade toggle */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_trade_ok} onChange={e => update('is_trade_ok', e.target.checked)} className="w-4 h-4 accent-brick" />
            <span className="text-sm font-medium">Open to trades</span>
          </label>
          {form.is_trade_ok && (
            <input type="text" value={form.trade_wants} onChange={e => update('trade_wants', e.target.value)} className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brick/30" placeholder="What sets would you accept in trade?" />
          )}
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-brick hover:bg-brick-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
          {submitting ? 'Publishing…' : 'Publish Listing'}
        </button>
      </form>
    </div>
  )
}
