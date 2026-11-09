import type { Listing } from '../data/sampleListings'
import Panel from './ui/Panel'

type FeaturedCardProps = {
  listing: Listing
  accent: string
}

function FeaturedCard({ listing, accent }: FeaturedCardProps) {
  const { seller } = listing

  return (
    <Panel key={listing.id} className="w-full max-w-sm animate-[fadeIn_0.4s_ease-out] p-5">
      {/* Item preview: real photo if there is one, emoji otherwise */}
      {listing.photo ? (
        <img src={listing.photo} alt={listing.title} className="aspect-[4/3] w-full rounded-xl object-cover" />
      ) : (
        <div
          className="flex aspect-[4/3] items-center justify-center rounded-xl text-8xl transition-colors duration-700"
          style={{ background: `radial-gradient(circle at 50% 40%, ${accent}55, transparent 70%)` }}
        >
          {listing.icon}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full border border-white/15 px-3 py-1 font-display text-xs text-muted">
          {listing.condition}
        </span>
        <span className="font-display text-xs text-muted">📍 {listing.pickup}</span>
      </div>

      {/* Seller */}
      <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-surface font-display text-sm font-bold">
          {seller.initials}
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">{seller.name}</p>
          <p className="text-xs text-muted">
            {seller.trades > 0 ? (
              <>
                <span className="text-lsu-gold">★ {seller.rating.toFixed(1)}</span> · {seller.trades} trades
              </>
            ) : (
              'New seller'
            )}
          </p>
        </div>
        {seller.verified && (
          <span className="rounded-full border border-verified/50 bg-verified/15 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-verified">
            ✓ Verified LSU
          </span>
        )}
      </div>
    </Panel>
  )
}

export default FeaturedCard
