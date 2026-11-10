import 'leaflet/dist/leaflet.css'
import './CampusMap.css'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { divIcon } from 'leaflet'
import type { LatLngTuple, LeafletMouseEvent, LocationEvent, Map as LeafletMap } from 'leaflet'
import type { Listing } from '../data/sampleListings'
import { seasonalTags } from '../data/sampleListings'
import { campusCenter, campusZones, zoneCoords, zoneInfo, zonePhotos } from '../data/campusZones'
import SpotView from './SpotView'
import Tag from './ui/Tag'

type CampusMapProps = {
  listings: Listing[]
  onPickZone: (zone: string) => void
}

type View = 'satellite' | 'holo'

// Two looks: real aerial photos (tinted blue) or a clean dark street map
const views: Record<View, { label: string; url: string; attribution: string }> = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
  holo: {
    label: 'Holo',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
}

// A glowing holographic pin, built with plain HTML + CSS (see CampusMap.css)
function pinIcon(count: number, hot: boolean) {
  const size = count > 0 ? 30 + Math.min(count, 6) * 4 : 22
  const classes = ['holo-pin', count > 0 ? '' : 'empty', hot ? 'hot' : ''].join(' ')
  return divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="${classes}"><span class="ring"></span><span class="ring two"></span><span class="core">${
      count > 0 ? count : ''
    }</span></div>`,
  })
}

const youIcon = divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: '<div class="holo-pin you"><span class="ring"></span><span class="core"></span></div>',
})

function CampusMap({ listings, onPickZone }: CampusMapProps) {
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [view, setView] = useState<View>('satellite')
  const [hoverZone, setHoverZone] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [userPos, setUserPos] = useState<LatLngTuple | null>(null)
  const [locating, setLocating] = useState(false)
  // The spot we're zoomed into (null = whole campus)
  const [activeZone, setActiveZone] = useState<string | null>(null)
  // Look at the spot: the map, a real photo, or a blocky pixel version of the photo
  const [lens, setLens] = useState<'map' | 'photo' | 'pixel'>('map')

  // Only count listings that match the tag filter
  const shown = selectedTag ? listings.filter((l) => l.tag === selectedTag) : listings

  // Group listings by pickup spot
  const byZone = new Map<string, Listing[]>()
  for (const listing of shown) {
    byZone.set(listing.pickup, [...(byZone.get(listing.pickup) ?? []), listing])
  }
  const offCampus = byZone.get('Off Campus') ?? []

  // Spots with pins, busiest first for the side list
  const pinnedZones = campusZones.filter((zone) => zoneCoords[zone])
  const rankedZones = [...pinnedZones].sort((a, b) => (byZone.get(b)?.length ?? 0) - (byZone.get(a)?.length ?? 0))

  // Listen for "find me" results, and print clicked coordinates (handy for fixing pin spots)
  useEffect(() => {
    if (!map) return
    const onFound = (event: LocationEvent) => {
      setUserPos([event.latlng.lat, event.latlng.lng])
      setLocating(false)
    }
    const onError = () => setLocating(false)
    const onClick = (event: LeafletMouseEvent) =>
      console.log(`[${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)}]`)

    map.on('locationfound', onFound)
    map.on('locationerror', onError)
    map.on('click', onClick)
    return () => {
      map.off('locationfound', onFound)
      map.off('locationerror', onError)
      map.off('click', onClick)
    }
  }, [map])

  // Dive into one spot: zoom close on the real building and open the spot panel
  function enterZone(zone: string) {
    if (!map) return
    setActiveZone(zone)
    // Nudge the target right so the building isn't hidden behind the panel
    const target = map.project(zoneCoords[zone], 19).subtract([map.getSize().x * 0.12, 0])
    map.flyTo(map.unproject(target, 19), 19, { duration: 1.4 })
  }

  function exitZone() {
    setActiveZone(null)
    map?.flyTo(campusCenter, 16, { duration: 1.2 })
  }

  // Step to the previous/next spot, like flipping through a game menu
  function stepZone(direction: 1 | -1) {
    const index = activeZone ? pinnedZones.indexOf(activeZone) : -1
    const next = pinnedZones[(index + direction + pinnedZones.length) % pinnedZones.length]
    enterZone(next)
  }

  function findMe() {
    if (!map) return
    setActiveZone(null)
    setLocating(true)
    map.locate({ setView: true, maxZoom: 17 })
  }

  // Keyboard: arrows flip spots, Esc backs out (only while zoomed in)
  useEffect(() => {
    if (!activeZone) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') exitZone()
      if (event.key === 'ArrowRight') stepZone(1)
      if (event.key === 'ArrowLeft') stepZone(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const activeItems = activeZone ? (byZone.get(activeZone) ?? []) : []
  const activeIndex = activeZone ? pinnedZones.indexOf(activeZone) : -1

  const tiles = views[view]

  return (
    <main className="relative px-8 pt-6 pb-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">Campus map</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Find items near you</h1>
          <p className="mt-2 text-sm text-muted">Click any spot to zoom in and look around. Pulsing pins have items.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {seasonalTags.map((tag) => (
            <Tag
              key={tag}
              label={tag}
              active={selectedTag === tag}
              onClick={() => setSelectedTag((current) => (current === tag ? null : tag))}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* The map */}
        <div
          className={`shopflow-map view-${view} relative h-[calc(100vh-280px)] min-h-96 overflow-hidden rounded-2xl border border-glow/30 shadow-[0_0_50px_rgb(47_107_255/0.35)]`}
        >
          <MapContainer ref={setMap} center={campusCenter} zoom={16} maxZoom={19} scrollWheelZoom className="h-full w-full">
            <TileLayer key={view} url={tiles.url} attribution={tiles.attribution} maxZoom={19} />

            {pinnedZones.map((zone) => {
              const items = byZone.get(zone) ?? []
              return (
                <Marker
                  key={zone}
                  position={zoneCoords[zone]}
                  icon={pinIcon(items.length, hoverZone === zone || activeZone === zone)}
                  eventHandlers={{
                    click: () => enterZone(zone),
                    mouseover: () => setHoverZone(zone),
                    mouseout: () => setHoverZone(null),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -18]}>
                    {zone} · {items.length}
                  </Tooltip>
                </Marker>
              )
            })}

            {userPos && (
              <Marker position={userPos} icon={youIcon}>
                <Tooltip permanent direction="top" offset={[0, -14]}>
                  You
                </Tooltip>
              </Marker>
            )}
          </MapContainer>

          {/* Console look: blue tint, scanlines, drifting light ribbons (sits above tiles, below pins) */}
          <div className="holo-tint pointer-events-none absolute inset-0 z-[450]" />
          <div className="holo-scan pointer-events-none absolute inset-0 z-[450]" />
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[450] h-40 w-full opacity-70"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="ribbon" x1="0" x2="1">
                <stop offset="0" stopColor="#38d6ff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#eef3ff" stopOpacity="0.9" />
                <stop offset="1" stopColor="#38d6ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="ribbon">
              <path d="M0 110 C 150 60, 300 150, 600 100 S 1050 60, 1200 110 S 1650 150, 1800 100 S 2250 60, 2400 110" fill="none" stroke="url(#ribbon)" strokeWidth="2" />
              <path d="M0 120 C 200 80, 400 160, 600 115 S 1000 80, 1200 120 S 1600 160, 1800 115 S 2200 80, 2400 120" fill="none" stroke="url(#ribbon)" strokeWidth="1" />
            </g>
            <g className="ribbon slow">
              <path d="M0 130 C 250 100, 450 150, 600 130 S 950 100, 1200 130 S 1650 150, 1800 130 S 2150 100, 2400 130" fill="none" stroke="#2f6bff" strokeOpacity="0.6" strokeWidth="6" />
            </g>
          </svg>

          {/* Spot mode: cinematic panel over the zoomed-in building */}
          {activeZone && (
            <>
              {zonePhotos[activeZone] && lens !== 'map' && (
                <div className="absolute inset-0 z-[455] overflow-hidden">
                  <SpotView
                    key={`${activeZone}-${lens}`}
                    src={zonePhotos[activeZone]}
                    name={activeZone}
                    pixel={lens === 'pixel'}
                  />
                </div>
              )}
              <div className="spot-vignette pointer-events-none absolute inset-0 z-[460]" />
              <div className="spot-target pointer-events-none z-[460]" />
              {/* Thin vertical guide line with end dots, like a HUD */}
              <div className="pointer-events-none absolute top-8 bottom-8 left-[62%] z-[460] w-px bg-gradient-to-b from-transparent via-glow/40 to-transparent" />

              <section
                key={activeZone}
                className="spot-panel absolute inset-y-0 left-0 z-[900] flex w-full max-w-md flex-col justify-between p-8 pt-20"
              >
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-glow">
                    Spot {String(activeIndex + 1).padStart(2, '0')} / {String(pinnedZones.length).padStart(2, '0')}
                  </p>
                  <h2 className="mt-4 font-display text-5xl leading-[1.05] font-bold">{activeZone}</h2>
                  <p className="mt-4 max-w-sm text-sm text-muted">{zoneInfo[activeZone]}</p>
                  <p className="mt-6 font-display text-sm">
                    <span className="text-3xl font-bold text-lsu-gold">{activeItems.length}</span>{' '}
                    <span className="text-muted">{activeItems.length === 1 ? 'item here' : 'items here'}</span>
                  </p>
                </div>

                <div>
                  {activeItems.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {activeItems.map((item) => (
                        <div
                          key={item.id}
                          className="w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-surface/80 backdrop-blur"
                        >
                          {item.photo ? (
                            <img src={item.photo} alt="" className="h-24 w-full object-cover" />
                          ) : (
                            <div className="flex h-24 items-center justify-center text-4xl">{item.icon}</div>
                          )}
                          <p className="truncate px-2 pt-1.5 text-xs">{item.title}</p>
                          <p className="px-2 pb-2 font-display text-xs font-bold text-lsu-gold">${item.price}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {activeItems.length > 0 && (
                      <button
                        onClick={() => onPickZone(activeZone)}
                        className="rounded-full bg-ink px-5 py-2.5 font-display text-sm font-bold text-bg transition hover:shadow-[0_0_24px_rgb(238_243_255/0.6)]"
                      >
                        Shop this spot →
                      </button>
                    )}
                    <button
                      onClick={() => stepZone(-1)}
                      aria-label="Previous spot"
                      className="rounded-full border border-white/15 px-4 py-2.5 font-display text-sm text-ink transition hover:border-glow"
                    >
                      ◀
                    </button>
                    <button
                      onClick={() => stepZone(1)}
                      aria-label="Next spot"
                      className="rounded-full border border-white/15 px-4 py-2.5 font-display text-sm text-ink transition hover:border-glow"
                    >
                      ▶
                    </button>
                    <button
                      onClick={exitZone}
                      className="rounded-full border border-white/15 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-glow hover:text-ink"
                    >
                      ✕ Back to campus
                    </button>
                  </div>
                  <p className="mt-3 text-[11px] text-muted">◀ ▶ keys to flip spots · Esc to back out</p>
                </div>
              </section>
            </>
          )}

          {/* In spot mode: choose how to look at the place */}
          {activeZone && (
            <div className="absolute top-3 right-3 z-[1000] flex rounded-full border border-white/15 bg-surface/90 p-1">
              {(
                [
                  ['map', '🛰 Map'],
                  ['photo', '📷 Real'],
                  ['pixel', '🟩 Pixel'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setLens(value)}
                  className={`rounded-full px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition ${
                    lens === value ? 'bg-neon text-ink shadow-[0_0_14px_rgb(47_107_255/0.7)]' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* View switch, like the official campus map */}
          <div
            className={`absolute top-3 right-3 z-[1000] flex rounded-full border border-white/15 bg-surface/90 p-1 ${
              activeZone ? 'hidden' : ''
            }`}
          >
            {(Object.keys(views) as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 font-display text-xs font-bold uppercase tracking-wider transition ${
                  view === v ? 'bg-neon text-ink shadow-[0_0_14px_rgb(47_107_255/0.7)]' : 'text-muted hover:text-ink'
                }`}
              >
                {views[v].label}
              </button>
            ))}
          </div>

          {/* Camera buttons */}
          <div className="absolute right-3 bottom-8 z-[1000] flex flex-col gap-2">
            <button
              onClick={findMe}
              className="rounded-full border border-white/15 bg-surface/90 px-4 py-2 font-display text-xs font-bold text-ink shadow-[0_0_14px_rgb(47_107_255/0.5)] transition hover:border-glow"
            >
              {locating ? 'Finding you...' : '◎ Find me'}
            </button>
            <button
              onClick={exitZone}
              className="rounded-full border border-white/15 bg-surface/90 px-4 py-2 font-display text-xs font-bold text-muted transition hover:border-glow hover:text-ink"
            >
              ⟲ All of campus
            </button>
          </div>
        </div>

        {/* Side list, synced with the map */}
        <aside className="rounded-2xl border border-white/10 bg-surface/70 p-4 backdrop-blur-md">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted">Meetup spots</p>
          <ul className="mt-3 space-y-1">
            {rankedZones.map((zone) => {
              const count = byZone.get(zone)?.length ?? 0
              const hovered = hoverZone === zone || activeZone === zone
              return (
                <li key={zone}>
                  <button
                    onClick={() => enterZone(zone)}
                    onMouseEnter={() => setHoverZone(zone)}
                    onMouseLeave={() => setHoverZone(null)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                      hovered ? 'bg-lsu-gold/15 text-ink' : count > 0 ? 'text-ink hover:bg-white/5' : 'text-muted hover:bg-white/5'
                    }`}
                  >
                    <span>📍 {zone}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-display text-xs font-bold ${
                        count > 0 ? 'bg-neon/30 text-glow' : 'text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {offCampus.length > 0 && (
            <button
              onClick={() => onPickZone('Off Campus')}
              className="mt-3 w-full rounded-full border border-white/15 px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-muted transition hover:border-glow hover:text-ink"
            >
              + {offCampus.length} off campus
            </button>
          )}
        </aside>
      </div>
    </main>
  )
}

export default CampusMap
