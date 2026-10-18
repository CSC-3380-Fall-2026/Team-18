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
      <div className="h-9 w-9 rounded-full border-2 border-neon bg-surface shadow-[0_0_14px_rgb(47_107_255/0.7)]" />
    </header>
  )
}

export default TopBar
