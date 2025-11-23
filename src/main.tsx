import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import App from './App.tsx'
import { config } from './lib/web3/config.ts'
import { RainbowKitThemeProvider } from './components/providers/RainbowKitThemeProvider.tsx'
import './index.css'

const queryClient = new QueryClient()

// Applica il tema iniziale al DOM prima di montare l'app
// Questo assicura che RainbowKit veda il tema corretto fin dall'inizio
function applyInitialTheme() {
  if (typeof window === "undefined") return
  
  const stored = localStorage.getItem("theme")
  const root = document.documentElement
  
  if (stored === "dark") {
    root.classList.add("dark")
  } else if (stored === "light") {
    root.classList.remove("dark")
  } else {
    // Usa la preferenza di sistema se non c'è un tema salvato
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    if (prefersDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }
}

// Sopprime gli errori innocui e i log di sviluppo
if (typeof window !== 'undefined') {
  // Intercetta console.log per filtrare i log di Vite HMR
  const originalLog = console.log
  console.log = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignora log di Vite HMR
    if (message.includes('[vite] hot updated')) {
      return // Non loggare questi messaggi
    }
    originalLog.apply(console, args)
  }

  // Intercetta gli errori di console per filtrare quelli di Coinbase Analytics
  const originalError = console.error
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignora errori di Coinbase Analytics SDK e network errors
    if (
      message.includes('Analytics SDK') ||
      message.includes('cca-lite.coinbase.com') ||
      message.includes('ERR_BLOCKED_BY_CLIENT') ||
      message.includes('coinbase.com') ||
      args.some(arg => typeof arg === 'string' && arg.includes('coinbase.com'))
    ) {
      return // Non loggare questi errori
    }
    originalError.apply(console, args)
  }

  // Intercetta anche i warning di Lit Protocol (dev mode)
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || ''
    // Ignora warning di Lit Protocol dev mode
    if (message.includes('lit.dev/msg/dev-mode')) {
      return // Non loggare questo warning
    }
    originalWarn.apply(console, args)
  }

  // Intercetta anche gli errori di rete che potrebbero essere loggati diversamente
  window.addEventListener('error', (event) => {
    const message = event.message || ''
    if (
      message.includes('coinbase.com') ||
      message.includes('ERR_BLOCKED_BY_CLIENT') ||
      (event.target && (event.target as any).src?.includes('coinbase.com'))
    ) {
      event.preventDefault()
      event.stopPropagation()
    }
  }, true)
}

// Applica il tema prima di renderizzare
applyInitialTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeProvider>
          <App />
        </RainbowKitThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)

