import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { Listing } from '../data/sampleListings'
import type { WishlistAlert } from '../lib/wishlist'
import { matchesAlert } from '../lib/wishlist'
import Panel from './ui/Panel'
import Button from './ui/Button'

type WishlistPageProps = {
  listings: Listing[]
  savedIds: Set<string>
  alerts: WishlistAlert[]
  myId: string
  onToggleSave: (listing: Listing) => void
  onAddAlert: (keyword: string) => Promise<string | null>
  onRemoveAlert: (id: string) => void
  onView: (listing: Listing) => void
}

const suggestions = ['jersey', 'textbook', 'mini fridge', 'calculator', 'tickets', 'lamp']

// A small photo card used for saved items and alert matches
function ItemCard({ listing, isNew, onView, children }: { listing: Listing; isNew?: boolean; onView: () => void; children?: React.ReactNode }) {
  return (
    <div className="group relative w-40 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-bg/70">
      <button onClick={onView} className="block w-full text-left">
        {listing.photo ? (
          <img src={listing.photo} alt="" className="h-28 w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-28 items-center justify-center text-4xl">{listing.icon}</div>
        )}
        <p className="truncate px-2.5 pt-2 text-sm">{listing.title}</p>
        <p className="px-2.5 pb-2.5 font-display text-sm font-bold text-lsu-gold">${listing.price}</p>
      </button>
      {isNew && (
        <span className="absolute top-2 left-2 rounded-full bg-lsu-gold px-2 py-0.5 font-display text-[10px] font-black text-bg">
          NEW
        </span>
      )}
      {children}
    </div>
  )
}

function WishlistPage({ listings, savedIds, alerts, myId, onToggleSave, onAddAlert, onRemoveAlert, onView }: WishlistPageProps) {
  const [keyword, setKeyword] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)

  const saved = listings.filter((listing) => savedIds.has(String(listing.id)))
  // Only real listings from other students can match an alert
  const others = listings.filter((listing) => listing.sellerId && listing.sellerId !== myId)

  async function handleAdd(event: SubmitEvent<HTMLFormElement>, value = keyword) {
    event.preventDefault()
    const clean = value.trim()
    if (clean.length < 2) return
    if (alerts.some((alert) => alert.keyword === clean.toLowerCase())) {
      setError(`You're already watching for "${clean}".`)
      return
    }
    setAdding(true)
    const problem = await onAddAlert(clean)
    setAdding(false)
    setError(problem ?? '')
    if (!problem) setKeyword('')
  }

  return (
    <main className="relative space-y-6 px-8 pt-6 pb-24">
      {/* Saved items */}
      <Panel className="mx-auto max-w-5xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Wishlist</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Saved items</h1>
        <p className="mt-2 text-sm text-muted">Hit ♡ on anything in Explore to keep it here.</p>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
          {saved.length === 0 && <p className="text-sm text-muted">Nothing saved yet.</p>}
          {saved.map((listing) => (
            <ItemCard key={listing.id} listing={listing} onView={() => onView(listing)}>
              <button
                onClick={() => onToggleSave(listing)}
                aria-label="Remove from wishlist"
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg/80 text-lsu-gold transition hover:scale-110"
              >
                ♥
              </button>
            </ItemCard>
          ))}
        </div>
      </Panel>

      {/* Alerts */}
      <Panel className="mx-auto max-w-5xl">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Alerts</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Tell me when someone posts...</h2>
        <p className="mt-2 text-sm text-muted">
          Add what you're looking for. When a matching item gets posted, you'll get a 🔔 pop-up and it shows up here.
        </p>

        <form onSubmit={handleAdd} className="mt-5 flex flex-wrap gap-3">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            maxLength={40}
            placeholder="e.g. jersey, mini fridge, CSC 3380"
            className="min-w-60 flex-1 rounded-xl border border-white/10 bg-bg/60 px-4 py-3 text-ink placeholder:text-muted focus:border-glow focus:outline-none focus:ring-2 focus:ring-glow/40"
          />
          <Button type="submit" disabled={adding || keyword.trim().length < 2}>
            {adding ? 'Adding...' : '🔔 Add alert'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        {alerts.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Try:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={(event) => handleAdd(event as unknown as SubmitEvent<HTMLFormElement>, s)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted transition hover:border-glow hover:text-ink"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-6">
          {alerts.map((alert) => {
            const matches = others.filter((listing) => matchesAlert(listing, alert.keyword))
            return (
              <div key={alert.id}>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-glow/50 bg-glow/10 px-3 py-1 font-display text-sm font-semibold">
                    🔔 {alert.keyword}
                  </span>
                  <span className="text-xs text-muted">
                    {matches.length} {matches.length === 1 ? 'match' : 'matches'}
                  </span>
                  <button
                    onClick={() => onRemoveAlert(alert.id)}
                    aria-label={`Stop watching for ${alert.keyword}`}
                    className="ml-auto text-sm text-muted hover:text-red-400"
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
                  {matches.length === 0 && <p className="text-sm text-muted">No matches yet. We'll let you know.</p>}
                  {matches.map((listing) => (
                    <ItemCard
                      key={listing.id}
                      listing={listing}
                      // "New" = posted after you started watching
                      isNew={!!listing.createdAt && listing.createdAt > alert.created_at}
                      onView={() => onView(listing)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </main>
  )
}

export default WishlistPage
