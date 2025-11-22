import { ReactNode, useEffect, useState } from "react"
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit"

interface RainbowKitThemeProviderProps {
  children: ReactNode
}

// Tema personalizzato per RainbowKit con colori aqua
const createWaveTheme = (baseTheme: ReturnType<typeof darkTheme | typeof lightTheme>) => {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      accentColor: "#00D9FF", // Aqua cyan
    },
    fonts: {
      ...baseTheme.fonts,
      body: "Inter, system-ui, sans-serif",
    },
    shadows: {
      ...baseTheme.shadows,
      connectButton: "0 4px 12px rgba(0, 217, 255, 0.2)",
    },
  }
}

const waveRKDark = createWaveTheme(darkTheme())
const waveRKLight = createWaveTheme(lightTheme())

// Funzione per ottenere il tema iniziale sincronizzato
function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false
  
  // Check localStorage first (stesso sistema di useTheme)
  const stored = localStorage.getItem("theme")
  if (stored === "dark") return true
  if (stored === "light") return false
  
  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return true
  }
  
  // Fallback to DOM class
  return document.documentElement.classList.contains("dark")
}

export function RainbowKitThemeProvider({ children }: RainbowKitThemeProviderProps) {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    // Applica il tema iniziale al DOM se non è già presente
    const root = document.documentElement
    const stored = localStorage.getItem("theme")
    
    if (stored === "dark" && !root.classList.contains("dark")) {
      root.classList.add("dark")
    } else if (stored === "light" && root.classList.contains("dark")) {
      root.classList.remove("dark")
    } else if (!stored) {
      // Se non c'è un tema salvato, usa la preferenza di sistema
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark && !root.classList.contains("dark")) {
        root.classList.add("dark")
        setIsDark(true)
      } else if (!prefersDark && root.classList.contains("dark")) {
        root.classList.remove("dark")
        setIsDark(false)
      }
    }

    // Ascolta i cambiamenti del tema dal DOM
    const observer = new MutationObserver(() => {
      const currentIsDark = document.documentElement.classList.contains("dark")
      if (currentIsDark !== isDark) {
        setIsDark(currentIsDark)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // Ascolta anche i cambiamenti di localStorage (per sincronizzazione cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        const newTheme = e.newValue === "dark"
        setIsDark(newTheme)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Ascolta i cambiamenti della preferenza di sistema
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Solo se non c'è un tema salvato in localStorage
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches)
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      observer.disconnect()
      window.removeEventListener("storage", handleStorageChange)
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [isDark])

  return (
    <RainbowKitProvider theme={isDark ? waveRKDark : waveRKLight}>
      {children}
    </RainbowKitProvider>
  )
}

