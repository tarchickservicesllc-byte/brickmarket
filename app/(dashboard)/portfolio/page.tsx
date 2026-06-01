'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, conditionLabel } from '@/lib/utils'
import SetSearch from '@/components/shared/SetSearch'
import type { LegoSet } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'

interface PortfolioRow {
  id: string
  quantity: number
  condition: string
  purchase_price: number | null
  purchase_date: string | null
  notes: string | null
  lego_set: LegoSet
}

export default function PortfolioPage() {
  const supabase = createClient()
  const [items, setItems] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedSet, setSelectedSet] = useState<LegoSet | null>(null)
  const [form, setForm] = useState({ condition: 'new_sealed', quantity: '1', purchase_price: '', purchase_date: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('portfolio_items')
      .select('*, lego_set:lego_sets(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems((data ?? []) as unknown as PortfolioRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addItem() {
    if (!selectedSet) { toast.error('Select a LEGO set first'); return }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('portfolio_items').insert({
      user_id: user.id,
      set_id: selectedSet.id,
      condition: form.condition as 'new_sealed' | 'used_complete' | 'used_incomplete' | 'parts_only',
      quantity: parseInt(form.quantity) || 1,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      purchase_date: form.purchase_date || null,
      notes: form.notes || null,
    })
    setSubmitting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Added to portfolio!')
    setShowAdd(false)
    setSelectedSet(null)
    setForm({ condition: 'new_sealed', quantity: '1', purchase_price: '', purchase_date: '', notes: '' })
    load()
  }

  async function removeItem(id: string) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    toast.success('Removed')
    load()
  }

  const totalCost = items.reduce((sum, i) => sum + (i.purchase_price ?? 0) * i.quantity, 0)
  const totalCurrentValue = items.reduce((sum, i) => sum + (i.lego_set.bricklink_avg_price ?? 0) * i.quantity, 0)
  const totalGain = totalCurrentValue - totalCost

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-gray-500 text-sm">{items.length} set{items.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-brick hover:bg-brick-dark text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Set
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Cost', value: formatCurrency(totalCost) },
          { label: 'Current Value', value: formatCurrency(totalCurrentValue) },
          { label: 'Unrealized Gain', value: formatCurrency(totalGain), positive: totalGain >= 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`text-xl font-black ${s.positive !== undefined ? (s.positive ? 'text-green-600' : 'text-red-500') : 'text-text-main'}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Add to Portfolio</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">LEGO Set</label>
                <SetSearch onSelect={setSelectedSet} />
                {selectedSet && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-surface rounded-lg text-sm">
                    {selectedSet.image_url && <Image src={selectedSet.image_url} alt={selectedSet.name} width={32} height={32} className="rounded w-8 h-8 object-cover" />}
                    <span className="font-medium">{selectedSet.name}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
                    {['new_sealed','used_complete','used_incomplete','parts_only'].map(c => (
                      <option key={c} value={c}>{conditionLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Buy Price ($)</label>
                  <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date Bought</label>
                  <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Optional notes…" />
              </div>
              <button onClick={addItem} disabled={submitting} className="w-full bg-brick hover:bg-brick-dark text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {submitting ? 'Adding…' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="font-semibold text-lg mb-1">No sets yet</h3>
          <p className="text-gray-400 text-sm">Add your first LEGO set to start tracking your portfolio.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 bg-brick text-white font-semibold px-6 py-2 rounded-lg text-sm">Add a Set</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Set</th>
                <th className="px-4 py-3 text-left">Condition</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Current</th>
                <th className="px-4 py-3 text-right">Gain</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(item => {
                const current = (item.lego_set.bricklink_avg_price ?? 0) * item.quantity
                const paid = (item.purchase_price ?? 0) * item.quantity
                const gain = current - paid
                return (
                  <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.lego_set.image_url && (
                          <Image src={item.lego_set.image_url} alt={item.lego_set.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        )}
                        <div>
                          <div className="font-medium text-sm">{item.lego_set.name}</div>
                          <div className="text-xs text-gray-400">#{item.lego_set.set_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{conditionLabel(item.condition)}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.purchase_price ? formatCurrency(paid) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{item.lego_set.bricklink_avg_price ? formatCurrency(current) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {paid && current ? (
                        <span className={gain >= 0 ? 'text-green-600' : 'text-red-500'}>{gain >= 0 ? '+' : ''}{formatCurrency(gain)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 text-sm transition-colors">✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
