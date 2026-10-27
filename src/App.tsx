import { useEffect, useRef, useState } from 'react'
import Background from './components/Background'
import TopBar from './components/TopBar'
import Button from './components/ui/Button'
import Tag from './components/ui/Tag'
import Tile from './components/ui/Tile'
import { sampleListings, seasonalTags, tagAccents } from './data/sampleListings'

function App() {
  const pageRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('Explore')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Only keep listings that match the selected tag (or all of them if none is selected)
  const visibleListings = selectedTag
    ? sampleListings.filter((listing) => listing.tag === selectedTag)
    : sampleListings

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

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const page = pageRef.current
    if (!page) return
    page.style.setProperty('--x', `${event.clientX}px`)
    page.style.setProperty('--y', `${event.clientY}px`)
  }

  return (
    <div ref={pageRef} onMouseMove={handleMouseMove} className="relative min-h-screen overflow-hidden">
      <Background accent={accent} />
      <div className="grid-glow pointer-events-none fixed inset-0" />

      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="relative px-8 pt-10">
        {/* Focused item details, console-style */}
        {focused && (
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
              <Button>Message Seller</Button>
              <Button variant="ghost">♡ Wishlist</Button>
            </div>
          </section>
        )}

        {/* Seasonal tag filters */}
        <div className="mt-12 flex flex-wrap gap-3">
          {seasonalTags.map((tag) => (
            <Tag key={tag} label={tag} active={selectedTag === tag} onClick={() => handleTagClick(tag)} />
          ))}
        </div>

        {/* Tile row */}
        <div className="mt-8 flex items-center gap-3">
          <p className="font-display text-sm font-semibold text-muted">
            {selectedTag ? `${selectedTag} near you` : 'Trending near you'}
          </p>
          <span className="rounded border border-white/15 px-1.5 font-display text-[10px] text-muted">◀ ▶</span>
        </div>
        <div className="mt-4 flex min-h-40 items-end gap-5 pb-24">
          {visibleListings.length === 0 && <p className="text-muted">Nothing listed for this season yet.</p>}
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
    </div>
  )
}

export default App

    