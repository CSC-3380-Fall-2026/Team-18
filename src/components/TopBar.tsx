import type { ReactNode } from 'react'
import Button from './ui/Button'
import { useState } from 'react'

const navTabs = ['Explore', 'Map', 'Sell', 'Messages', 'Wishlist']

type TopBarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
  email: string
  onSignOut: () => void
  // Extra buttons on the right (the notification bell)
  actions?: ReactNode
  // Little count bubbles on tabs, e.g. { Messages: 2 }
  badges?: Record<string, number>
}

function TopBar({ activeTab, onTabChange, email, onSignOut, actions, badges = {} }: TopBarProps) {
  // "calvin.akpunku@lsu.edu" -> "CA", "cakpun1@lsu.edu" -> "CA"
  const name = email.split('@')[0]
  const parts = name.split(/[._]/).filter(Boolean)
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
  const [isProfileOpen , setIsProfileOpen] = useState(false)

  return (
    <header className="relative z-40 flex items-center justify-between px-8 py-6">
      <span className="font-display text-xl font-extrabold tracking-wide">
        SHOP<span className="text-neon">FLOW</span>
      </span>
      <nav className="flex gap-8">
        {navTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative pb-2 font-display text-sm font-semibold transition ${
              activeTab === tab ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {tab}
            {(badges[tab] ?? 0) > 0 && (
              <span className="absolute -top-2 -right-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-lsu-gold px-1 font-display text-[10px] font-black text-bg shadow-[0_0_8px_rgb(253_208_35/0.8)]">
                {badges[tab]}
              </span>
            )}
            {activeTab === tab && <span className="neon-strip absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full" />}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        {actions}
        <Button variant="ghost" onClick={() => onTabChange('Sell')}>
          + Post an item
        </Button>
        {/* Profile avatar and dropdown menu */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title="Profile menu"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-surface font-display text-sm font-bold shadow-[0_0_14px_rgb(47_107_255/0.7)]"
        >
          {initials}
        </button>
          {isProfileOpen && (
              <div className ="absolute right-8 top-full mt-2 w-64 rounded-3x1 border border-white/10 bg-surface p-4 shadow-2x1 z-50 overflow-hidden"
                   style={{ borderRadius: '24px' }}>
                  <div className="mb-3 border-b border-white/10 pb-3">
                      <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-glow">
                          My Account
                      </p>
                      <p className="mt-2 break-all font-display text-sm text-ink">
                          {email}
                      </p>
                  </div>
                  <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left font-display text-sm font-bold text-ink transition hover:bg-neon/15">
                      My Profile
                  </button>
                  <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left font-display text-sm font-bold text-ink transition hover:bg-neon/15">
                      My Listings
                  </button>
                  <div className="my-2 border-t border-white/10"/>
                  <button
                      type="button"
                      onClick={onSignOut}
                      className="w-full rounded-lg px-3 py-2.5 text-left font-display text-sm font-bold text-red-400 transition hover:bg-red-400/10">
                      Log Out
                  </button>
              </div>
          )}
      </div>
    </header>
  )
}

export default TopBar

