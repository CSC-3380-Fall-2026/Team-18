type TagProps = {
  label: string
  active?: boolean
  onClick?: () => void
}

function Tag({ label, active = false, onClick }: TagProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition ${
        active
          ? 'border-glow bg-glow/15 text-glow shadow-[0_0_14px_rgb(56_214_255/0.5)]'
          : 'border-white/15 text-muted hover:border-glow/50 hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}

export default Tag
