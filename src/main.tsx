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

