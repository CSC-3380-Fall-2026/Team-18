import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

type SpotViewProps = {
  src: string
  name: string
  pixel: boolean
}

// Shows a real photo of the meetup spot that you can "look around" in:
// move the mouse (or drag on a phone) and the camera turns like in a game.
// In pixel mode, the photo is redrawn as chunky blocks, like a Minecraft version of campus.
function SpotView({ src, name, pixel }: SpotViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [missing, setMissing] = useState(false)
  // Where the camera is looking, from -1 to 1 on each axis
  const [look, setLook] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!pixel) return
    const canvas = canvasRef.current
    if (!canvas) return

    const image = new Image()
    image.onload = () => {
      // Draw the photo tiny (about 110 blocks wide); CSS scales it up with hard edges
      const blocksWide = 110
      canvas.width = blocksWide
      canvas.height = Math.round((image.height / image.width) * blocksWide)
      const context = canvas.getContext('2d')
      if (!context) return
      context.imageSmoothingEnabled = false
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      // Limit the colors a bit so it reads as blocks, not just blur
      const data = context.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = Math.round(data.data[i] / 32) * 32
        data.data[i + 1] = Math.round(data.data[i + 1] / 32) * 32
        data.data[i + 2] = Math.round(data.data[i + 2] / 32) * 32
      }
      context.putImageData(data, 0, 0)
    }
    image.src = src
  }, [src, pixel])

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    setLook({
      x: ((event.clientX - box.left) / box.width) * 2 - 1,
      y: ((event.clientY - box.top) / box.height) * 2 - 1,
    })
  }

  if (missing) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg/80">
        <p className="max-w-xs text-center text-sm text-muted">
          📸 No photo of {name} yet. Add one at <span className="text-ink">public{src}</span>
        </p>
      </div>
    )
  }

  // Turn the "head": rotate and slide the oversized photo opposite to the pointer
  const camera = {
    transform: `perspective(1200px) rotateY(${look.x * 6}deg) rotateX(${-look.y * 4}deg) translate(${-look.x * 6}%, ${
      -look.y * 4
    }%) scale(1.3)`,
  }

  return (
    <div
      className="h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setLook({ x: 0, y: 0 })}
    >
      <div className="h-full w-full transition-transform duration-300 ease-out" style={camera}>
        {pixel ? (
          <canvas
            ref={canvasRef}
            aria-label={`${name}, pixel view`}
            className="spot-arrival h-full w-full object-cover [image-rendering:pixelated]"
          />
        ) : (
          <img
            src={src}
            alt={name}
            draggable={false}
            onError={() => setMissing(true)}
            className="spot-arrival h-full w-full object-cover select-none"
          />
        )}
      </div>
    </div>
  )
}

export default SpotView
