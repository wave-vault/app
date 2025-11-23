import { Link, useLocation } from "react-router-dom"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"
import logoImage from "@/logo/logo.png"
import { useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAccount, useSwitchChain } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { BASE_CHAIN_ID } from "@/lib/constants/rpc"
import { AlertTriangle } from "lucide-react"

export function Header() {
  const location = useLocation()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { isConnected, chain } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { switchChain } = useSwitchChain()

  // Check if the connected wallet is on Base network
  const isOnBaseNetwork = chain?.id === BASE_CHAIN_ID
  const showNetworkWarning = isConnected && !isOnBaseNetwork

  const isActive = (path: string) => location.pathname === path

  const handleAddLiquidityClick = (e: React.MouseEvent) => {
    if (!isConnected && openConnectModal) {
      e.preventDefault()
      openConnectModal()
    }
  }

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: BASE_CHAIN_ID })
    }
  }

  // Check if we're on landing page
  const isLandingPage = location.pathname === '/'

  // Hide header on scroll down for mobile (same logic as footer)
  // For desktop on landing page: hide after first scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (isMobile) {
        // Mobile logic: show on scroll up, hide on scroll down
        if (currentScrollY < lastScrollY || currentScrollY < 20) {
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false)
        }
      } else if (isLandingPage) {
        // Desktop landing page: hide after first scroll down, show on scroll up
        if (currentScrollY < lastScrollY || currentScrollY < 20) {
          // Scrolling up or at top
          setIsVisible(true)
        } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down and past threshold
          setIsVisible(false)
        }
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMobile, isLandingPage, lastScrollY])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] w-full glass-apple rounded-b-2xl transition-transform duration-300 will-change-transform",
        // Mobile: hide/show based on scroll
        // Desktop landing page: hide/show based on scroll
        // Desktop other pages: always visible
        isVisible || (!isMobile && !isLandingPage) ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1">
            <span className="text-black dark:text-white font-bold h-8 leading-none flex items-center">1</span>
            <img
              src={logoImage}
              alt="Wave Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation - hidden on mobile, shown on desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link to="/swap">
              <Button
                variant={isActive("/swap") ? "glass-apple" : "ghost"}
                className={cn(
                  "rounded-full",
                  isActive("/swap") && "glass-apple"
                )}
              >
                Swap
              </Button>
            </Link>
            <Link to="/create-vault">
              <Button
                variant={isActive("/create-vault") ? "glass-apple" : "ghost"}
                className={cn(
                  "rounded-full",
                  isActive("/create-vault") && "glass-apple"
                )}
              >
                Create Vault
              </Button>
            </Link>
            <Link to="/vaults" onClick={handleAddLiquidityClick}>
              <Button
                variant={isActive("/vaults") ? "glass-apple" : "ghost"}
                className={cn(
                  "rounded-full",
                  isActive("/vaults") && "glass-apple"
                )}
              >
                Add Liquidity
              </Button>
            </Link>
          </nav>

          {/* Wallet Connect & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Network Warning Button - Desktop */}
            {showNetworkWarning && (
              <Button
                onClick={handleSwitchNetwork}
                variant="destructive"
                size="sm"
                className="hidden sm:flex items-center gap-2 rounded-full animate-pulse hover:animate-none"
              >
                <AlertTriangle className="h-4 w-4" />
                Change Network
              </Button>
            )}
            <ThemeToggle />
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            {/* Network Warning Button - Mobile */}
            {showNetworkWarning && (
              <button
                onClick={handleSwitchNetwork}
                className="sm:hidden flex items-center gap-1 h-8 px-2 rounded-lg bg-red-500 dark:bg-red-600 text-white text-xs font-medium animate-pulse hover:animate-none"
              >
                <AlertTriangle className="h-3 w-3" />
                Switch
              </button>
            )}
            {/* Compact wallet button for mobile */}
            <div className="sm:hidden">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-aqua-500 to-aqua-600 text-white text-xs font-medium"
                      >
                        Connect
                      </button>
                    )
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      className="flex items-center justify-center h-8 px-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60px]">
                        {account.displayName}
                      </span>
                    </button>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

