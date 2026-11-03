import Button from './ui/Button'

const navTabs = ['Explore', 'Map', 'Sell', 'Messages']

type TopBarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
  email: string
  onSignOut: () => void
}

function TopBar({ activeTab, onTabChange, email, onSignOut }: TopBarProps) {
  // "calvin.akpunku@lsu.edu" -> "CA", "cakpun1@lsu.edu" -> "CA"
  const name = email.split('@')[0]
  const parts = name.split(/[._]/).filter(Boolean)
  const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()

  return (
    <header className="relative flex items-center justify-between px-8 py-6">
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
            {activeTab === tab && <span className="neon-strip absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full" />}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onTabChange('Sell')}>
          + Post an item
        </Button>
        {/* Profile avatar with notification dot (click to log out for now) */}
        <button
          onClick={onSignOut}
          title={`${email} (click to log out)`}
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-surface font-display text-sm font-bold shadow-[0_0_14px_rgb(47_107_255/0.7)]"
        >
          {initials}
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg bg-lsu-gold" />
        </button>
      </div>
    </header>
  )
}

export default TopBar
