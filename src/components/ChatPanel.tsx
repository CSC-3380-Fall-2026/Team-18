import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../lib/supabase'
import { fetchThread, markThreadRead, sendMessage } from '../lib/messages'
import type { ChatTarget, Message } from '../lib/messages'
import Button from './ui/Button'

type ChatPanelProps = {
  chat: ChatTarget
  myId: string
  onClose: () => void
}

function ChatPanel({ chat, myId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { listingId, otherUserId } = chat

  // Load the conversation, then listen for new messages live
  useEffect(() => {
    let active = true

    fetchThread(listingId, otherUserId).then((thread) => {
      if (!active) return
      setMessages(thread)
      setLoading(false)
      markThreadRead(listingId, otherUserId, myId)
    })

    const channel = supabase
      .channel(`chat:${listingId}:${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listingId}` },
        (payload) => {
          const message = payload.new as Message
          // Only keep messages between me and this person
          const inThisChat = message.sender_id === otherUserId || message.receiver_id === otherUserId
          if (!inThisChat) return
          setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]))
          if (message.sender_id === otherUserId) markThreadRead(listingId, otherUserId, myId)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [listingId, otherUserId, myId])

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return

    setSending(true)
    setError('')
    const { error: sendError } = await sendMessage(listingId, otherUserId, body)
    setSending(false)

    if (sendError) {
      setError(sendError.message)
      return
    }
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-bg/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-surface/95 shadow-[0_0_40px_rgb(47_107_255/0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-glow">{chat.listingTitle}</p>
            <p className="mt-1 font-display text-lg font-bold">{chat.otherName}</p>
          </div>
          <button onClick={onClose} aria-label="Close chat" className="text-2xl text-muted hover:text-ink">
            ×
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-muted">No messages yet. Say hi and set up a meetup on campus.</p>
          )}
          {messages.map((message) => {
            const mine = message.sender_id === myId
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? 'bg-neon text-ink shadow-[0_0_14px_rgb(47_107_255/0.5)]' : 'border border-white/10 bg-bg/70'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-ink/70' : 'text-muted'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Send box */}
        <form onSubmit={handleSend} className="border-t border-white/10 p-4">
          {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              placeholder="Is this still available?"
              className="flex-1 rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
            />
            <Button type="submit" disabled={sending || !draft.trim()}>
              {sending ? '...' : 'Send'}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default ChatPanel
