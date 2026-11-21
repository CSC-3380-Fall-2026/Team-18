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
  // Called after this chat's messages are marked read, so the unread badge can update
  onRead?: () => void
}

// One-tap starters so buyers don't have to think of what to say
const quickReplies = ['Is this still available?', 'When can you meet?', 'Would you take a little less?', 'On my way!']

// Put messages in time order and drop duplicates
function addMessage(list: Message[], message: Message) {
  if (list.some((m) => m.id === message.id)) return list
  return [...list, message].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

// "Today", "Yesterday", or "Nov 17" for the little date dividers
function dayLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function ChatPanel({ chat, myId, onClose, onRead }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const onReadRef = useRef(onRead)

  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])

  const { listingId, otherUserId } = chat

  // Load the conversation, then listen for new messages and "seen" updates live
  useEffect(() => {
    let active = true

    function markRead() {
      markThreadRead(listingId, otherUserId, myId).then(() => onReadRef.current?.())
    }

    fetchThread(listingId, otherUserId).then((thread) => {
      if (!active) return
      setMessages(thread)
      setLoading(false)
      markRead()
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
          setMessages((current) => addMessage(current, message))
          if (message.sender_id === otherUserId) markRead()
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `listing_id=eq.${listingId}` },
        (payload) => {
          // The other person opened the chat: flip my messages to "Seen"
          const updated = payload.new as Message
          setMessages((current) => current.map((m) => (m.id === updated.id ? { ...m, read: updated.read } : m)))
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

  async function send(text: string) {
    const body = text.trim()
    if (!body || sending) return

    setSending(true)
    setError('')
    const { data, error: sendError } = await sendMessage(listingId, otherUserId, body)
    setSending(false)

    if (sendError || !data) {
      setError(sendError?.message ?? 'Message did not send. Try again.')
      return
    }
    // Show it right away instead of waiting on the live update
    setMessages((current) => addMessage(current, data as Message))
    setDraft('')
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    send(draft)
  }

  // The last message I sent, so "Seen" only shows once
  const lastMine = [...messages].reverse().find((m) => m.sender_id === myId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-bg/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md animate-[fadeIn_0.25s_ease-out] flex-col border-l border-white/10 bg-surface/95 shadow-[0_0_40px_rgb(47_107_255/0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-bg font-display text-sm font-bold">
              {chat.otherName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight">{chat.otherName}</p>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-glow">{chat.listingTitle}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close chat" className="text-2xl text-muted hover:text-ink">
            ×
          </button>
        </header>

        {/* Safety reminder */}
        <p className="border-b border-white/10 bg-bg/40 px-5 py-2 text-xs text-muted">
          🛡️ Meet in a public spot on campus and check the item before you pay.
        </p>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-muted">No messages yet. Say hi and set up a meetup on campus.</p>
          )}
          {messages.map((message, index) => {
            const mine = message.sender_id === myId
            const newDay = index === 0 || dayLabel(messages[index - 1].created_at) !== dayLabel(message.created_at)
            return (
              <div key={message.id}>
                {newDay && (
                  <p className="my-2 text-center font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {dayLabel(message.created_at)}
                  </p>
                )}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
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
                {mine && message.id === lastMine?.id && (
                  <p className="mt-1 text-right text-[10px] text-muted">{message.read ? 'Seen' : 'Sent'}</p>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies + send box */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickReplies.map((text) => (
              <button
                key={text}
                type="button"
                disabled={sending}
                onClick={() => send(text)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted transition hover:border-glow hover:text-ink disabled:opacity-40"
              >
                {text}
              </button>
            ))}
          </div>
          {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              placeholder="Type a message..."
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
