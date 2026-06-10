'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Thread {
 listing_id: string | null
 listing_title: string
 other_user: string
 other_user_id: string
 last_message: string
 last_time: string
 unread: number
}

interface Msg {
 id: string
 body: string
 sender_id: string
 created_at: string
 is_read: boolean
}

export default function MessagesPage() {
 const supabase = createClient()
 const [threads, setThreads] = useState<Thread[]>([])
 const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
 const [messages, setMessages] = useState<Msg[]>([])
 const [newMsg, setNewMsg] = useState('')
 const [sending, setSending] = useState(false)
 const [currentUserId, setCurrentUserId] = useState<string | null>(null)
 const bottomRef = useRef<HTMLDivElement>(null)

 useEffect(() => {
 async function load() {
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 setCurrentUserId(user.id)

 type MsgRow = { id: string; listing_id: string | null; body: string; sender_id: string; recipient_id: string; is_read: boolean; created_at: string; listing: { title: string } | null; sender: { username: string } | null; recipient: { username: string } | null }
 const { data: msgs } = await supabase
 .from('messages')
 .select(`
 id, listing_id, body, sender_id, recipient_id, is_read, created_at,
 listing:listings(title),
 sender:profiles!messages_sender_id_fkey(username),
 recipient:profiles!messages_recipient_id_fkey(username)
 `)
 .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
 .order('created_at', { ascending: false }) as unknown as { data: MsgRow[] | null }

 if (!msgs) return

 const threadMap: Record<string, Thread> = {}
 for (const m of msgs) {
 const key = m.listing_id ?? 'no-listing'
 const otherIsRecipient = m.sender_id === user.id
 const otherId = otherIsRecipient ? m.recipient_id : m.sender_id
 const otherName = otherIsRecipient
 ? (m.recipient as { username?: string } | null)?.username ?? 'Unknown'
 : (m.sender as { username?: string } | null)?.username ?? 'Unknown'

 if (!threadMap[key]) {
 threadMap[key] = {
 listing_id: m.listing_id,
 listing_title: (m.listing as { title?: string } | null)?.title ?? 'Listing',
 other_user: otherName,
 other_user_id: otherId,
 last_message: m.body,
 last_time: m.created_at,
 unread: (!m.is_read && m.recipient_id === user.id) ? 1 : 0,
 }
 } else if (!m.is_read && m.recipient_id === user.id) {
 threadMap[key].unread++
 }
 }
 setThreads(Object.values(threadMap))
 }
 load()
 }, [])

 async function openThread(thread: Thread) {
 setSelectedThread(thread)
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 const { data } = await supabase
 .from('messages')
 .select('*')
 .eq('listing_id', thread.listing_id ?? '')
 .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
 .order('created_at', { ascending: true })
 setMessages((data ?? []) as Msg[])
 // Mark as read
 await supabase.from('messages')
 .update({ is_read: true })
 .eq('listing_id', thread.listing_id ?? '')
 .eq('recipient_id', user.id)
 setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
 }

 async function send() {
 if (!newMsg.trim() || !selectedThread) return
 setSending(true)
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return
 const { data, error } = await supabase.from('messages').insert({
 listing_id: selectedThread.listing_id,
 sender_id: user.id,
 recipient_id: selectedThread.other_user_id,
 body: newMsg,
 }).select().single()
 setSending(false)
 if (error) { toast.error('Failed to send'); return }
 setMessages(prev => [...prev, data as Msg])
 setNewMsg('')
 setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
 }

 const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0)

 return (
 <div className="flex h-[calc(100vh-10rem)] gap-4">
 {/* Threads list */}
 <div className="w-72 flex-shrink-0 bg-slate-800 rounded-2xl border border-slate-700 overflow-y-auto">
 <div className="p-4 border-b border-slate-700">
 <h1 className="font-bold text-white">Messages {totalUnread > 0 && <span className="ml-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{totalUnread}</span>}</h1>
 </div>
 {threads.length === 0 ? (
 <div className="p-8 text-center text-slate-500 text-sm">No messages yet</div>
 ) : (
 threads.map(t => (
 <button key={t.listing_id} onClick={() => openThread(t)}
 className={`w-full text-left px-4 py-3 border-b border-slate-700 hover:bg-slate-700 transition-colors ${selectedThread?.listing_id === t.listing_id ? 'bg-blue-900/30' : ''}`}>
 <div className="flex items-center justify-between">
 <span className="font-medium text-sm text-slate-100">{t.other_user}</span>
 {t.unread > 0 && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{t.unread}</span>}
 </div>
 <div className="text-xs text-slate-500 truncate">{t.listing_title}</div>
 <div className="text-xs text-slate-500 truncate">{t.last_message}</div>
 </button>
 ))
 )}
 </div>

 {/* Conversation */}
 <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden">
 {selectedThread ? (
 <>
 <div className="p-4 border-b border-slate-700">
 <div className="font-semibold text-white">@{selectedThread.other_user}</div>
 <div className="text-xs text-slate-400">{selectedThread.listing_title}</div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-950">
 {messages.map(m => (
 <div key={m.id} className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
 <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${m.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
 {m.body}
 <div className={`text-xs mt-0.5 ${m.sender_id === currentUserId ? 'text-white/60' : 'text-slate-500'}`}>
 {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </div>
 </div>
 </div>
 ))}
 <div ref={bottomRef} />
 </div>
 <div className="p-4 border-t border-slate-700 flex gap-2 bg-slate-800">
 <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
 placeholder="Type a message…"
 className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 text-white placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
 <button onClick={send} disabled={sending || !newMsg.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
 Send
 </button>
 </div>
 </>
 ) : (
 <div className="flex-1 flex items-center justify-center text-slate-500">
 <div className="text-center">
 <div className="text-5xl mb-3">💬</div>
 <p>Select a conversation</p>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
