import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchConversations } from '../lib/messages'
import type { ChatTarget, Conversation } from '../lib/messages'
import Panel from './ui/Panel'

type MessagesPageProps = {
  myId: string
  onOpen: (chat: ChatTarget) => void
}

// "3m", "2h", "Nov 17" next to each chat
function shortTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function MessagesPage({ myId, onOpen }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  // Load the inbox, then reload it live whenever a message comes in or goes out
  useEffect(() => {
    let active = true

    function load() {
      fetchConversations(myId).then((list) => {
        if (!active) return
        setConversations(list)
        setLoading(false)
      })
    }
    load()

    const channel = supabase
      .channel('inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [myId])

  return (
    <main className="relative px-8 pt-6 pb-24">
      <Panel className="mx-auto max-w-3xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Messages</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Your chats</h1>

        <div className="mt-6 divide-y divide-white/10">
          {loading && <p className="py-4 text-sm text-muted">Loading...</p>}
          {!loading && conversations.length === 0 && (
            <p className="py-4 text-sm text-muted">No messages yet. Find something on Explore and hit Message Seller.</p>
          )}
          {conversations.map((c) => (
            <button
              key={`${c.listingId}:${c.otherUserId}`}
              onClick={() => onOpen(c)}
              className="flex w-full items-center gap-4 rounded-xl px-2 py-4 text-left transition hover:bg-white/5"
            >
              {c.photo ? (
                <img src={c.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bg text-2xl">💬</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold">
                  {c.listingTitle} <span className="font-sans font-normal text-muted">· {c.otherName}</span>
                </p>
                <p className={`truncate text-sm ${c.unread > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>{c.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-muted">{shortTime(c.lastAt)}</span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-lsu-gold px-2 py-0.5 font-display text-xs font-bold text-bg">{c.unread}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Panel>
    </main>
  )
}

export default MessagesPage
