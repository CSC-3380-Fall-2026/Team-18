import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { fetchListings } from './lib/listings'
import type { ChatTarget } from './lib/messages'
import AddListing from './components/AddListing'
import Background from './components/Background'
import CampusMap from './components/CampusMap'
import ChatPanel from './components/ChatPanel'
import FeaturedCard from './components/FeaturedCard'
import Login from './components/Login'
import MessagesPage from './components/MessagesPage'
import TopBar from './components/TopBar'
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
      />

      {activeTab === 'Sell' ? (
        <AddListing onPosted={handlePosted} />
      ) : activeTab === 'Map' ? (
        <CampusMap listings={allListings} onPickZone={handlePickZone} />
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
                  <Button variant="ghost">♡ Wishlist</Button>
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

      {/* Chat drawer slides in over any page */}
      {chat && (
        <ChatPanel
          key={`${chat.listingId}:${chat.otherUserId}`}
          chat={chat}
          myId={session.user.id}
          onClose={() => setChat(null)}
        />
      )}
    </div>
  )
}

export default App
