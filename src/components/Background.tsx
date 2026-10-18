// Console-style background: ambient glow that follows the focused item,
// circuit traces with traveling light, a horizon light streak, and particles

type BackgroundProps = {
  accent: string
}

const circuitPaths = [
  'M0 60 H300 V110 H340',
  'M180 0 V150 H210 V210',
  'M80 240 H260 V300',
  'M1440 70 H1120 V140 H1080',
  'M1280 0 V200 H1250',
  'M0 760 H160 V700 H230',
  'M260 900 V780 H330 V740',
  'M1440 690 H1180 V780 H1120',
  'M1320 900 V720',
]

// Positions are computed once, outside the component, so they never change between renders
const particles = Array.from({ length: 40 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  delay: `${(i % 7) * -0.9}s`,
  size: i % 5 === 0 ? 3 : 2,
}))

function Background({ accent }: BackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Floor light: a wide beam along the horizon, tinted by the focused item */}
      <div
        className="absolute top-[78%] left-1/2 h-64 w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,currentColor,transparent_60%)] opacity-25 transition-colors duration-700"
        style={{ color: accent }}
      />
      <div
        className="absolute top-0 inset-x-0 h-px opacity-60 transition-colors duration-700"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
      />

      {/* Circuit traces with a pulse of light traveling along each one */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        {circuitPaths.map((d, i) => (
          <g key={d} fill="none" strokeLinecap="round">
            <path d={d} stroke="rgb(47 107 255 / 0.25)" strokeWidth="1.5" />
            <path
              d={d}
              pathLength={1000}
              stroke="#38d6ff"
              strokeWidth="2"
              strokeDasharray="60 940"
              className="animate-trace"
              style={{ animationDelay: `${i * -0.7}s`, filter: 'drop-shadow(0 0 4px #38d6ff)' }}
            />
          </g>
        ))}
      </svg>

      {/* Horizon light streak */}
      <div className="absolute top-[78%] left-0 h-px w-full bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
      <div className="absolute top-[78%] -mt-px h-[3px] w-1/3 animate-streak rounded-full bg-gradient-to-r from-transparent via-glow to-lsu-gold blur-[1px]" />

      {/* Twinkling particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-glow"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }}
        />
      ))}
    </div>
  )
}

export default Background

