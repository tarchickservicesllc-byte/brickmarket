'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LegoSet } from '@/types/database'
import Image from 'next/image'

interface Props {
  onSelect: (set: LegoSet) => void
  placeholder?: string
  value?: string
}

export default function SetSearch({ onSelect, placeholder = 'Search LEGO sets…', value }: Props) {
  const [query, setQuery] = useState(value ?? '')
  const [results, setResults] = useState<LegoSet[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('lego_sets')
        .select('*')
        .or(`name.ilike.%${query}%,set_number.ilike.%${query}%,theme.ilike.%${query}%`)
        .limit(8)
      setResults(data ?? [])
      setOpen(true)
      setLoading(false)
    }, 300)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function pick(set: LegoSet) {
    setQuery(`${set.name} (#${set.set_number})`)
    setOpen(false)
    onSelect(set)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pl-9 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs animate-pulse">...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          {results.map(set => (
            <button
              key={set.id}
              type="button"
              onMouseDown={() => pick(set)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 text-left transition-colors border-b border-slate-700 last:border-0"
            >
              {set.image_url && (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                  <Image src={set.image_url} alt={set.name} width={40} height={40} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-100 truncate">{set.name}</div>
                <div className="text-xs text-slate-400">#{set.set_number} · {set.theme}</div>
              </div>
              {set.bricklink_avg_price && (
                <div className="text-xs font-semibold text-emerald-400 flex-shrink-0">${set.bricklink_avg_price}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
