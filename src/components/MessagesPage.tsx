import { useEffect, useState } from 'react'
import { fetchConversations } from '../lib/messages'
import type { ChatTarget, Conversation } from '../lib/messages'
import Panel from './ui/Panel'

type MessagesPageProps = {
  myId: string
  onOpen: (chat: ChatTarget) => void
}

function MessagesPage({ myId, onOpen }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchConversations(myId).then((list) => {
      if (!active) return
      setConversations(list)
      setLoading(false)
    })
    return () => {
      active = false
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
              className="flex w-full items-center gap-4 py-4 text-left transition hover:bg-white/5"
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
                <p className={`truncate text-sm ${c.unread > 0 ? 'text-ink' : 'text-muted'}`}>{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="rounded-full bg-lsu-gold px-2 py-0.5 font-display text-xs font-bold text-bg">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </Panel>
    </main>
  )
}

export default MessagesPage
