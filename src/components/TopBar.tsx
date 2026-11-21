import type { ReactNode } from 'react'
import Button from './ui/Button'

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
        {/* Profile avatar (click to log out for now) */}
        <button
          onClick={onSignOut}
          title={`${email} (click to log out)`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-surface font-display text-sm font-bold shadow-[0_0_14px_rgb(47_107_255/0.7)]"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}

export default TopBar

