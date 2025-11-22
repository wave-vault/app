import { useEffect, useRef, useState } from "react"

export function AnimatedWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark")
    }
    return false
  })

  useEffect(() => {
    // Ascolta i cambiamenti del tema
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Imposta la dimensione del canvas
    const resizeCanvas = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + "px"
      canvas.style.height = height + "px"
      
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Pattern binario sottile per texture
    const getBinaryPattern = (x: number, y: number, time: number): boolean => {
      const pattern = Math.floor((x * 0.06 + y * 0.04 + time * 2) % 20)
      return pattern < 10
    }

    let time = 0
    let animationId: number

    const animate = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Colori per dark mode: onde aqua/cyan più visibili
      const bgColor = isDark 
        ? "#0a0a0f" // Nero bluastro molto scuro per dark mode
        : "transparent" // Trasparente per light mode (usa background CSS)
      
      const waveColor = isDark 
        ? "rgba(0, 217, 255, 0.35)" // Aqua/cyan più visibile per dark mode
        : "rgba(14, 165, 233, 0.25)" // Sky blue più evidente per light
      const patternColor = isDark
        ? "rgba(0, 191, 255, 0.25)" // Aqua più chiaro per pattern in dark mode
        : "rgba(14, 165, 233, 0.15)" // Pattern più evidente per light

      // Disegna background (solo in dark mode)
      if (isDark) {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)
      } else {
        ctx.clearRect(0, 0, width, height)
      }

      // Disegna una singola forma d'onda elegante
      const centerY = height * 0.65 // Posizionata più in basso
      const amplitude = 100 // Ampiezza moderata
      const frequency = 0.006 // Frequenza bassa per movimento lento
      const speed = 0.012 // Movimento lento e fluido

      ctx.beginPath()
      ctx.moveTo(0, centerY)

      // Disegna l'onda con pattern binario sottile
      for (let x = 0; x <= width; x += 1) {
        // Onda base sinusoidale pulita
        const baseWave = Math.sin(x * frequency + time * speed) * amplitude
        
        // Pattern binario sottile
        const binary = getBinaryPattern(x, centerY, time)
        const binaryMod = binary ? 3 : -3 // Modulazione leggera

        // Variazione leggera per movimento naturale
        const subtleNoise = Math.sin(x * 0.12 + time * 0.35) * 4

        const y = centerY + baseWave + binaryMod + subtleNoise
        ctx.lineTo(x, y)
      }

      // Chiudi il path creando una forma fluida
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()

      // Gradiente - aqua/cyan per dark mode, sky blue per light mode
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, waveColor)
      gradient.addColorStop(0.4, isDark ? "rgba(0, 217, 255, 0.25)" : "rgba(14, 165, 233, 0.18)")
      gradient.addColorStop(0.7, isDark ? "rgba(0, 191, 255, 0.15)" : "rgba(14, 165, 233, 0.1)")
      gradient.addColorStop(1, isDark ? "rgba(0, 150, 200, 0.05)" : "transparent")

      ctx.fillStyle = gradient
      ctx.fill()

      // Pattern binario discreto ma visibile sulla forma
      ctx.globalAlpha = 1
      for (let x = 0; x < width; x += 3) {
        const waveY = centerY + Math.sin(x * frequency + time * speed) * amplitude
        for (let y = Math.max(0, waveY - 25); y < Math.min(height, waveY + 25); y += 3) {
          if (getBinaryPattern(x, y, time)) {
            ctx.fillStyle = patternColor
            ctx.fillRect(x, y, 2, 2)
          }
        }
      }

      time += 0.01 // Movimento lento
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isDark])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0,
      }}
    />
  )
}

