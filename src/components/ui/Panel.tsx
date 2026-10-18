import type { ReactNode } from 'react'

type PanelProps = {
  children: ReactNode
  className?: string
}

function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-surface/70 p-6 backdrop-blur-md ${className}`}>
      {children}
    </div>
  )
}

export default Panel
