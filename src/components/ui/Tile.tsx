import type { Listing } from '../../data/sampleListings'

type TileProps = {
  listing: Listing
  focused: boolean
  onFocus: () => void
}

function Tile({ listing, focused, onFocus }: TileProps) {
  return (
    <button
      onMouseEnter={onFocus}
      onFocus={onFocus}
      aria-label={listing.title}
      className={`reflect shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-neon/40 to-surface transition-all duration-300 ease-out ${
        focused ? 'h-40 w-40 ring-2 ring-ink shadow-[0_0_30px_rgb(47_107_255/0.8)]' : 'h-28 w-28 opacity-60'
      }`}
    />
  )
}

export default Tile
