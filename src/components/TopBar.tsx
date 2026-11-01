import Button from './ui/Button'

const navTabs = ['Explore', 'Map', 'Sell', 'Messages']

type TopBarProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

function TopBar({ activeTab, onTabChange }: TopBarProps) {
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
        {/* Profile avatar with notification dot */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-neon bg-surface font-display text-sm font-bold shadow-[0_0_14px_rgb(47_107_255/0.7)]">
          CA
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg bg-lsu-gold" />
        </div>
      </div>
    </header>
  )
}

export default TopBar
