import { tagAccents, type Listing } from '../../data/sampleListings'

type TileProps = {
  listing: Listing
  focused: boolean
  onFocus: () => void
}

function Tile({ listing, focused, onFocus }: TileProps) {
  const accent = tagAccents[listing.tag] ?? '#2f6bff'

  return (
    <button
      onMouseEnter={onFocus}
      onFocus={onFocus}
      aria-label={listing.title}
      className={`reflect relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-neon/40 to-surface transition-all duration-300 ease-out ${
        focused ? 'h-40 w-40 ring-2 ring-ink shadow-[0_0_30px_rgb(47_107_255/0.8)]' : 'h-28 w-28 opacity-60'
      }`}
    >
      <span className={`transition-all duration-300 ${focused ? 'text-5xl' : 'text-4xl'}`}>{listing.icon}</span>
      <span className="mt-2 font-display text-sm font-bold text-lsu-gold">${listing.price}</span>
      {/* Season color bar */}
      <span className="absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />
    </button>
  )
}

export default Tile
