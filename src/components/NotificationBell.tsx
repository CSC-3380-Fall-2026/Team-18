import { useEffect, useRef, useState } from 'react'

export type Notification = {
  listingId: string
  keyword: string
  title: string
  price: number
  photo?: string | null
  icon: string
  createdAt: string
}

type NotificationBellProps = {
  items: Notification[]
  // Anything newer than this counts as unread
  lastSeen: string
  onOpen: () => void
  onView: (listingId: string) => void
}

// "8h", "3m", "2d" like a console notification
function timeAgo(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function NotificationBell({ items, lastSeen, onOpen, onView }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const unread = items.filter((item) => item.createdAt > lastSeen).length

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return
    function handleClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggle() {
    if (!open) onOpen()
    setOpen((current) => !current)
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-surface/80 text-lg transition hover:border-glow"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lsu-gold px-1 font-display text-[10px] font-black text-bg shadow-[0_0_10px_rgb(253_208_35/0.8)]">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-12 right-0 z-50 w-96 animate-[fadeIn_0.25s_ease-out] rounded-2xl border border-white/10 bg-surface/95 p-4 shadow-[0_0_40px_rgb(47_107_255/0.35)] backdrop-blur-md">
          <p className="font-display text-2xl font-bold">Notifications</p>

          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Nothing yet. Add alerts in your Wishlist and we'll ping you here.
              </p>
            )}
            {items.map((item, index) => (
              <button
                key={item.listingId}
                onClick={() => {
                  setOpen(false)
                  onView(item.listingId)
                }}
                // Newest one glows, like the selected tile on a console menu
                className={`flex w-full items-center gap-3 rounded-xl border-2 bg-bg/60 p-3 text-left transition hover:border-glow hover:shadow-[0_0_18px_rgb(56_214_255/0.5)] ${
                  index === 0 ? 'border-glow shadow-[0_0_18px_rgb(56_214_255/0.5)]' : 'border-transparent'
                }`}
              >
                {item.photo ? (
                  <img src={item.photo} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neon text-2xl">{item.icon}</span>
                )}
                <span className="min-w-0 flex-1 text-sm leading-snug">
                  <span className="font-semibold text-lsu-gold">Wishlist match!</span> {item.title} was just posted
                  <span className="block text-xs text-muted">
                    ${item.price} · matches "{item.keyword}"
                  </span>
                </span>
                <span className="self-start font-display text-xs text-muted">
                  {timeAgo(item.createdAt)}
                  {item.createdAt > lastSeen && <span className="mt-1 block h-2 w-2 rounded-full bg-lsu-gold" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
