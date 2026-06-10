'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, conditionLabel } from '@/lib/utils'
import SetSearch from '@/components/shared/SetSearch'
import type { LegoSet } from '@/types/database'
import Image from 'next/image'
import { toast } from 'sonner'
import { X } from 'lucide-react'

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
    const { data } = await supabase.from('portfolio_items').select('*, lego_set:lego_sets(*)').eq('user_id', user.id).order('created_at', { ascending: false })
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

  const inputCls = 'w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
  const labelCls = 'block text-xs font-semibold text-slate-300 mb-1'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-slate-400 text-sm">{items.length} set{items.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
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
          <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className={`text-xl font-black ${s.positive !== undefined ? (s.positive ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-white">Add to Portfolio</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>LEGO Set</label>
                <SetSearch onSelect={setSelectedSet} />
                {selectedSet && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-slate-900 rounded-lg text-sm">
                    {selectedSet.image_url && <Image src={selectedSet.image_url} alt={selectedSet.name} width={32} height={32} className="rounded w-8 h-8 object-cover" />}
                    <span className="font-medium text-slate-200">{selectedSet.name}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Condition</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none">
                    {['new_sealed','used_complete','used_incomplete','parts_only'].map(c => (
                      <option key={c} value={c}>{conditionLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quantity</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Buy Price ($)</label>
                  <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Date Bought</label>
                  <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Optional notes…" />
              </div>
              <button onClick={addItem} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {submitting ? 'Adding…' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-12 text-center">
          <div className="text-5xl mb-3">📦</div>
          <h3 className="font-semibold text-lg text-white mb-1">No sets yet</h3>
          <p className="text-slate-400 text-sm">Add your first LEGO set to start tracking your portfolio.</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg text-sm">Add a Set</button>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-700">
              {items.map(item => {
                const current = (item.lego_set.bricklink_avg_price ?? 0) * item.quantity
                const paid = (item.purchase_price ?? 0) * item.quantity
                const gain = current - paid
                return (
                  <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.lego_set.image_url && (
                          <Image src={item.lego_set.image_url} alt={item.lego_set.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover bg-slate-700" />
                        )}
                        <div>
                          <div className="font-medium text-sm text-slate-100">{item.lego_set.name}</div>
                          <div className="text-xs text-slate-500">#{item.lego_set.set_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{conditionLabel(item.condition)}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-200">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-200">{item.purchase_price ? formatCurrency(paid) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-200">{item.lego_set.bricklink_avg_price ? formatCurrency(current) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {paid && current ? (
                        <span className={gain >= 0 ? 'text-emerald-400' : 'text-red-400'}>{gain >= 0 ? '+' : ''}{formatCurrency(gain)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
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
