import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { fetchListings } from './lib/listings'
import { fetchName, fetchUnreadCount } from './lib/messages'
import type { ChatTarget, Message } from './lib/messages'
import { addAlert, fetchAlerts, fetchSavedIds, isNewer, matchesAlert, removeAlert, saveListing, unsaveListing } from './lib/wishlist'
import type { WishlistAlert } from './lib/wishlist'
import AddListing from './components/AddListing'
import Background from './components/Background'
import CampusMap from './components/CampusMap'
import ChatPanel from './components/ChatPanel'
import FeaturedCard from './components/FeaturedCard'
import Login from './components/Login'
import MessagesPage from './components/MessagesPage'
import NotificationBell from './components/NotificationBell'
import type { Notification } from './components/NotificationBell'
import TopBar from './components/TopBar'
import WishlistPage from './components/WishlistPage'
import Button from './components/ui/Button'
import Tag from './components/ui/Tag'
import Tile from './components/ui/Tile'
import { sampleListings, seasonalTags, tagAccents } from './data/sampleListings'
import { campusZones } from './data/campusZones'
import type { Listing } from './data/sampleListings'

function App() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Explore')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [realListings, setRealListings] = useState<Listing[]>([])
  const [chat, setChat] = useState<ChatTarget | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [alerts, setAlerts] = useState<WishlistAlert[]>([])
  // Pop-up when a new listing matches one of my alerts
  const [toast, setToast] = useState<{ keyword: string; listingId: string; title: string } | null>(null)
  // Messages: unread count for the tab badge, and a pop-up when a new one arrives
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [messageToast, setMessageToast] = useState<(ChatTarget & { body: string }) | null>(null)

  // Real listings from Supabase. Fall back to the samples while the database is empty.
  const allListings = realListings.length > 0 ? realListings : sampleListings

  // Only keep listings that match the selected tag and campus zone (if any are selected)
  const visibleListings = allListings.filter(
    (listing) =>
      (!selectedTag || listing.tag === selectedTag) && (!selectedZone || listing.pickup === selectedZone),
  )

  const focused = visibleListings[focusedIndex] ?? visibleListings[0]
  const accent = focused ? (tagAccents[focused.tag] ?? '#2f6bff') : '#2f6bff'

  function handleTagClick(tag: string) {
    // Clicking the active tag again turns the filter off
    setSelectedTag((current) => (current === tag ? null : tag))
    setFocusedIndex(0)
  }

  // Controller-style navigation: left/right arrow keys move between tiles
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') {
        setFocusedIndex((i) => Math.min(i + 1, visibleListings.length - 1))
      } else if (event.key === 'ArrowLeft') {
        setFocusedIndex((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visibleListings.length])

  // Who is logged in? Check once on load, then listen for login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  // Once someone is logged in, load the listings from the database
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let active = true
    fetchListings().then((listings) => {
      if (active) setRealListings(listings)
    })
    return () => {
      active = false
    }
  }, [userId])

  // Load my wishlist (saved items + alerts) once I'm logged in
  useEffect(() => {
    if (!userId) return
    let active = true
    Promise.all([fetchSavedIds(), fetchAlerts()]).then(([ids, myAlerts]) => {
      if (!active) return
      setSavedIds(ids)
      setAlerts(myAlerts)
    })
    return () => {
      active = false
    }
  }, [userId])

  // Live: when anyone posts a listing, refresh Explore and check it against my alerts
  const alertsRef = useRef<WishlistAlert[]>([])
  useEffect(() => {
    alertsRef.current = alerts
  }, [alerts])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('new-listings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
        const row = payload.new as { id: string; title: string; seller_id: string; seasonal_tag: string | null; category: string }
        fetchListings().then(setRealListings)
        if (row.seller_id === userId) return
        const listing = { title: row.title, tag: row.seasonal_tag ?? 'General Trading', category: row.category }
        const hit = alertsRef.current.find((alert) => matchesAlert(listing, alert.keyword))
        if (hit) setToast({ keyword: hit.keyword, listingId: row.id, title: row.title })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Unread messages: count them on login, then watch for new ones sent to me
  const chatRef = useRef<ChatTarget | null>(null)
  useEffect(() => {
    chatRef.current = chat
  }, [chat])
  const listingsRef = useRef<Listing[]>([])
  useEffect(() => {
    listingsRef.current = allListings
  })

  useEffect(() => {
    if (!userId) return
    const me = userId
    fetchUnreadCount(me).then(setUnreadMessages)

    const channel = supabase
      .channel('my-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${me}` },
        async (payload) => {
          const message = payload.new as Message
          fetchUnreadCount(me).then(setUnreadMessages)
          // No pop-up if I'm already looking at that chat
          const open = chatRef.current
          if (open && open.listingId === message.listing_id && open.otherUserId === message.sender_id) return
          const listing = listingsRef.current.find((l) => String(l.id) === message.listing_id)
          const otherName = await fetchName(message.sender_id)
          setMessageToast({
            listingId: message.listing_id,
            listingTitle: listing?.title ?? 'your listing',
            otherUserId: message.sender_id,
            otherName,
            body: message.body,
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  function refreshUnread() {
    if (userId) fetchUnreadCount(userId).then(setUnreadMessages)
  }

  // Hide the message pop-up after a few seconds
  useEffect(() => {
    if (!messageToast) return
    const timer = setTimeout(() => setMessageToast(null), 8000)
    return () => clearTimeout(timer)
  }, [messageToast])

  // Notification center: every listing from someone else that matches an alert,
  // posted after I started watching for it. Newest first.
  const notifications: Notification[] = []
  const seenIds = new Set<string>()
  for (const listing of allListings) {
    if (!listing.sellerId || listing.sellerId === userId || !listing.createdAt) continue
    const createdAt = listing.createdAt
    const hit = alerts.find((alert) => isNewer(createdAt, alert.created_at) && matchesAlert(listing, alert.keyword))
    if (!hit || seenIds.has(String(listing.id))) continue
    seenIds.add(String(listing.id))
    notifications.push({
      listingId: String(listing.id),
      keyword: hit.keyword,
      title: listing.title,
      price: listing.price,
      photo: listing.photo,
      icon: listing.icon,
      createdAt,
    })
  }
  notifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  // When I last opened the bell (saved in this browser so the badge stays cleared)
  const seenKey = 'shopflow-notifications-seen'
  const [lastSeen, setLastSeen] = useState(() => {
    try {
      return localStorage.getItem(seenKey) ?? ''
    } catch {
      return ''
    }
  })
  function markNotificationsSeen() {
    const now = new Date().toISOString()
    setLastSeen(now)
    try {
      localStorage.setItem(seenKey, now)
    } catch {
      // Storage can be blocked (private mode); the badge just won't remember
    }
  }

  // Hide the pop-up after a few seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 7000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleToggleSave(listing: Listing) {
    const id = String(listing.id)
    const isSaved = savedIds.has(id)
    // Update the heart right away, then save to the database
    setSavedIds((current) => {
      const next = new Set(current)
      if (isSaved) next.delete(id)
      else next.add(id)
      return next
    })
    const { error } = isSaved ? await unsaveListing(id) : await saveListing(id)
    if (error) {
      console.error('Could not update wishlist:', error.message)
      setSavedIds(await fetchSavedIds())
    }
  }

  async function handleAddAlert(keyword: string) {
    const { data, error } = await addAlert(keyword)
    if (error || !data) return error?.message ?? 'Could not add that alert.'
    setAlerts((current) => [...current, data as WishlistAlert])
    return null
  }

  async function handleRemoveAlert(id: string) {
    setAlerts((current) => current.filter((alert) => alert.id !== id))
    await removeAlert(id)
  }

  // Jump to a listing on Explore (from the wishlist or an alert pop-up)
  function handleViewListing(listingId: string) {
    const index = allListings.findIndex((listing) => String(listing.id) === listingId)
    setSelectedTag(null)
    setSelectedZone(null)
    setFocusedIndex(Math.max(index, 0))
    setActiveTab('Explore')
    setToast(null)
  }

  // After posting: go back to Explore, show everything, and reload so the new item appears first
  function handlePosted() {
    setActiveTab('Explore')
    setSelectedTag(null)
    setSelectedZone(null)
    setFocusedIndex(0)
    fetchListings().then(setRealListings)
  }

  // From the map: jump to Explore, filtered to that spot
  function handlePickZone(zone: string) {
    setSelectedZone(zone)
    setSelectedTag(null)
    setFocusedIndex(0)
    setActiveTab('Explore')
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const page = pageRef.current
    if (!page) return
    page.style.setProperty('--x', `${event.clientX}px`)
    page.style.setProperty('--y', `${event.clientY}px`)
  }

  // Still checking for a session: show nothing for a split second
  if (authLoading) return null

  // Not logged in: show the login screen
  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Background accent="#2f6bff" />
        <div className="relative">
          <Login />
        </div>
      </div>
    )
  }

  return (
    <div ref={pageRef} onMouseMove={handleMouseMove} className="relative min-h-screen overflow-hidden">
      <Background accent={accent} />
      <div className="grid-glow pointer-events-none fixed inset-0" />

      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        email={session.user.email ?? ''}
        onSignOut={() => supabase.auth.signOut()}
        badges={{ Messages: unreadMessages }}
        actions={
          <NotificationBell
            items={notifications}
            lastSeen={lastSeen}
            onOpen={markNotificationsSeen}
            onView={handleViewListing}
          />
        }
      />

      {activeTab === 'Sell' ? (
        <AddListing onPosted={handlePosted} />
      ) : activeTab === 'Map' ? (
        <CampusMap listings={allListings} onPickZone={handlePickZone} />
      ) : activeTab === 'Wishlist' ? (
        <WishlistPage
          listings={allListings}
          savedIds={savedIds}
          alerts={alerts}
          myId={session.user.id}
          onToggleSave={handleToggleSave}
          onAddAlert={handleAddAlert}
          onRemoveAlert={handleRemoveAlert}
          onView={(listing) => handleViewListing(String(listing.id))}
        />
      ) : activeTab === 'Messages' ? (
        // key changes when a chat closes, so the inbox reloads with the latest messages
        <MessagesPage key={chat ? 'chat-open' : 'chat-closed'} myId={session.user.id} onOpen={setChat} />
      ) : (
        <main className="relative px-8 pt-10">
          {/* Focused item: details on the left, featured card on the right */}
          {focused && (
            <div className="flex items-start justify-between gap-10">
              <section key={focused.id} className="min-h-56 max-w-3xl animate-[fadeIn_0.4s_ease-out]">
                <p
                  className="font-display text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-700"
                  style={{ color: accent }}
                >
                  {focused.tag}
                </p>
                <h1 className="mt-3 font-display text-5xl font-bold leading-tight">{focused.title}</h1>
                <p className="mt-3 text-muted">
                  Pickup at <span className="text-ink">{focused.pickup}</span>
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <span className="font-display text-3xl font-bold text-lsu-gold">${focused.price}</span>
                  <Button
                    disabled={!focused.sellerId || focused.sellerId === session.user.id}
                    onClick={() =>
                      focused.sellerId &&
                      setChat({
                        listingId: String(focused.id),
                        listingTitle: focused.title,
                        otherUserId: focused.sellerId,
                        otherName: focused.seller.name,
                      })
                    }
                    className="disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {focused.sellerId === session.user.id ? 'Your listing' : 'Message Seller'}
                  </Button>
                  {focused.sellerId && focused.sellerId !== session.user.id && (
                    <Button variant="ghost" onClick={() => handleToggleSave(focused)}>
                      {savedIds.has(String(focused.id)) ? (
                        <span className="text-lsu-gold">♥ Saved</span>
                      ) : (
                        '♡ Wishlist'
                      )}
                    </Button>
                  )}
                </div>
              </section>
              <div className="hidden lg:block">
                <FeaturedCard listing={focused} accent={accent} />
              </div>
            </div>
          )}

          {/* Seasonal tag filters + campus zone filter */}
          <div className="mt-12 flex flex-wrap items-center gap-3">
            {seasonalTags.map((tag) => (
              <Tag key={tag} label={tag} active={selectedTag === tag} onClick={() => handleTagClick(tag)} />
            ))}
            <select
              value={selectedZone ?? ''}
              onChange={(event) => {
                setSelectedZone(event.target.value || null)
                setFocusedIndex(0)
              }}
              aria-label="Filter by campus spot"
              className={`rounded-full border bg-bg/60 px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider transition focus:outline-none [&>option]:bg-surface [&>option]:text-ink ${
                selectedZone ? 'border-glow text-ink shadow-[0_0_16px_rgb(56_214_255/0.45)]' : 'border-white/15 text-muted'
              }`}
            >
              <option value="">📍 All of campus</option>
              {campusZones.map((zone) => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Tile row */}
          <div className="mt-8 flex items-center gap-3">
            <p className="font-display text-sm font-semibold text-muted">
              {selectedZone
                ? `${selectedTag ?? 'Listings'} at ${selectedZone}`
                : selectedTag
                  ? `${selectedTag} near you`
                  : 'Trending near you'}
            </p>
            <span className="rounded border border-white/15 px-1.5 font-display text-[10px] text-muted">◀ ▶</span>
          </div>
          <div className="mt-4 flex min-h-40 items-end gap-5 pb-24">
            {visibleListings.length === 0 && <p className="text-muted">Nothing listed here yet.</p>}
            {visibleListings.map((listing, index) => (
              <Tile
                key={listing.id}
                listing={listing}
                focused={index === focusedIndex}
                onFocus={() => setFocusedIndex(index)}
              />
            ))}
          </div>
        </main>
      )}

      {/* Alert pop-up: a new listing matches something on my wishlist */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-[60] w-80 animate-[fadeIn_0.4s_ease-out] rounded-2xl border border-lsu-gold/50 bg-surface/95 p-4 shadow-[0_0_30px_rgb(253_208_35/0.35)] backdrop-blur">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-lsu-gold">🔔 Wishlist alert</p>
          <p className="mt-2 text-sm">
            New match for <span className="font-semibold">"{toast.keyword}"</span>: {toast.title}
          </p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => handleViewListing(toast.listingId)}>View</Button>
            <Button variant="ghost" onClick={() => setToast(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Message pop-up: someone just messaged me */}
      {messageToast && (
        <div className="fixed top-24 right-6 z-[60] w-80 animate-[fadeIn_0.4s_ease-out] rounded-2xl border border-glow/50 bg-surface/95 p-4 shadow-[0_0_30px_rgb(56_214_255/0.35)] backdrop-blur">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-glow">💬 New message</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">{messageToast.otherName}</span> about {messageToast.listingTitle}:
          </p>
          <p className="mt-1 truncate text-sm text-muted">"{messageToast.body}"</p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => {
                setChat(messageToast)
                setMessageToast(null)
              }}
            >
              Reply
            </Button>
            <Button variant="ghost" onClick={() => setMessageToast(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Chat drawer slides in over any page */}
      {chat && (
        <ChatPanel
          key={`${chat.listingId}:${chat.otherUserId}`}
          chat={chat}
          myId={session.user.id}
          onClose={() => {
            setChat(null)
            refreshUnread()
          }}
          onRead={refreshUnread}
        />
      )}
    </div>
  )
}

export default App
