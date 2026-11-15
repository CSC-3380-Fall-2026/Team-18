import { useEffect, useMemo, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { MAX_MESSAGE_LENGTH, chatKey } from '../lib/messages'
import type { ChatTarget, Conversation } from '../lib/messages'
import type { Messaging } from '../lib/useMessaging'
import { formatClock, formatDayLabel, isSameDay } from '../lib/messageFormat'
import Button from './ui/Button'

type MessagesPageProps = {
  myId: string
  messaging: Messaging
  selected: ChatTarget | null
  onSelect: (chat: ChatTarget) => void
}

function Thumb({ photo, size }: { photo: string | null; size: string }) {
  return photo ? (
    <img src={photo} alt="" className={`${size} shrink-0 rounded-xl object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-bg text-xl`}>💬</span>
  )
}

function MessagesPage({ myId, messaging, selected, onSelect }: MessagesPageProps) {
  const { messages, conversations, loading, error, send, markRead } = messaging
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedKey = selected ? chatKey(selected.listingId, selected.otherUserId) : null

  // A chat opened from "Message Seller" has no messages yet, so add it to the list by hand
  const list = useMemo(() => {
    if (!selected || conversations.some((c) => chatKey(c.listingId, c.otherUserId) === selectedKey)) return conversations
    const pending: Conversation = { ...selected, lastMessage: '', lastAt: '', unread: 0, photo: null }
    return [pending, ...conversations]
  }, [conversations, selected, selectedKey])

  const thread = useMemo(
    () =>
      selected
        ? messages.filter(
            (m) =>
              m.listing_id === selected.listingId &&
              (m.sender_id === selected.otherUserId || m.receiver_id === selected.otherUserId),
          )
        : [],
    [messages, selected],
  )

  // Opening a chat (or getting a new message while it's open) marks it as read
  const unreadHere = list.find((c) => chatKey(c.listingId, c.otherUserId) === selectedKey)?.unread ?? 0
  const openListingId = selected?.listingId
  const openOtherId = selected?.otherUserId
  useEffect(() => {
    if (openListingId && openOtherId && unreadHere > 0) markRead(openListingId, openOtherId)
  }, [openListingId, openOtherId, unreadHere, markRead])

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, selectedKey])

  async function handleSend(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!selected || !body) return

    setSending(true)
    setSendError('')
    const failure = await send(selected.listingId, selected.otherUserId, body)
    setSending(false)

    if (failure) setSendError(failure)
    else setDraft('')
  }

  return (
    <main className="relative px-8 pt-2 pb-8">
      <div className="mx-auto flex h-[calc(100vh-9rem)] min-h-[30rem] max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-md">
        {/* Inbox */}
        <section className="flex w-80 shrink-0 flex-col border-r border-white/10">
          <div className="px-5 pt-5 pb-3">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Messages</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Your chats</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <p className="px-5 py-4 text-sm text-muted">Loading...</p>}
            {!loading && error && <p className="px-5 py-4 text-sm text-red-400">Could not load messages: {error}</p>}
            {!loading && !error && list.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted">No messages yet. Find something on Explore and hit Message Seller.</p>
            )}
            {list.map((c) => {
              const key = chatKey(c.listingId, c.otherUserId)
              return (
                <button
                  key={key}
                  onClick={() => onSelect(c)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/5 ${
                    key === selectedKey ? 'bg-neon/15' : ''
                  }`}
                >
                  <Thumb photo={c.photo} size="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold">{c.otherName}</p>
                    <p className="truncate text-xs text-glow/80">{c.listingTitle}</p>
                    <p className={`truncate text-sm ${c.unread > 0 ? 'font-semibold text-ink' : 'text-muted'}`}>
                      {c.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-lsu-gold px-2 py-0.5 font-display text-xs font-bold text-bg">
                      {c.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <span className="text-4xl">💬</span>
              <p className="font-display text-lg font-bold">Pick a chat</p>
              <p className="text-sm text-muted">Choose a conversation on the left, or message a seller from a listing.</p>
            </div>
          ) : (
            <>
              <header className="border-b border-white/10 px-5 py-4">
                <p className="font-display text-lg font-bold">{selected.otherName}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-glow">{selected.listingTitle}</p>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {thread.length === 0 && (
                  <p className="text-sm text-muted">No messages yet. Say hi and set up a meetup on campus.</p>
                )}
                {thread.map((message, index) => {
                  const mine = message.sender_id === myId
                  const newDay = index === 0 || !isSameDay(thread[index - 1].created_at, message.created_at)
                  return (
                    <div key={message.id}>
                      {newDay && (
                        <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
                          {formatDayLabel(message.created_at)}
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
                            {formatClock(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-white/10 p-4">
                {sendError && <p className="mb-2 text-sm text-red-400">{sendError}</p>}
                <div className="flex gap-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder="Is this still available?"
                    className="flex-1 rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()}>
                    {sending ? '...' : 'Send'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

export default MessagesPage
