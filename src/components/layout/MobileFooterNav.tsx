import { useEffect, useState } from "react"
import { useLocation, Link } from "react-router-dom"
import { useAccount } from "wagmi"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { ArrowLeftRight, PlusCircle, Droplets } from "lucide-react"
import { useConnectModal } from "@rainbow-me/rainbowkit"

// Hook for controlling footer visibility on scroll
export const useFooterVisibility = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show on scroll up, hide on scroll down
      if (currentScrollY < lastScrollY || currentScrollY < 20) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return { isVisible }
}

export function MobileFooterNav() {
  const location = useLocation()
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { isVisible } = useFooterVisibility()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleAddLiquidityClick = (e: React.MouseEvent) => {
    if (!isConnected && openConnectModal) {
      e.preventDefault()
      openConnectModal()
    }
  }

  // Define the navigation items
  const navItems = [
    {
      name: "Swap",
      route: "/swap",
      icon: ArrowLeftRight,
      active: location.pathname === "/swap",
    },
    {
      name: "Create Vault",
      route: "/create-vault",
      icon: PlusCircle,
      active: location.pathname === "/create-vault",
    },
    {
      name: "Add Liquidity",
      route: "/vaults",
      icon: Droplets,
      active: location.pathname === "/vaults" || location.pathname.startsWith("/vaults/"),
    },
  ]

  // Add/remove a class to the document body when footer visibility changes
  useEffect(() => {
    if (isVisible && isMobile) {
      document.body.classList.add("footer-visible")
    } else {
      document.body.classList.remove("footer-visible")
    }

    return () => {
      document.body.classList.remove("footer-visible")
    }
  }, [isVisible, isMobile])

  // Only show footer on mobile/tablet vertical
  if (!isMobile) {
    return null
  }

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 glass-apple z-40 transition-transform duration-300 rounded-t-2xl",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center px-2 py-1.5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.route}
            onClick={item.name === "Add Liquidity" ? handleAddLiquidityClick : undefined}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1.5 px-1 no-underline relative transition-all duration-200 min-w-0",
              item.active
                ? "text-aqua-500 dark:text-aqua-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            aria-label={item.name}
          >
            {/* Icon */}
            <item.icon
              className={cn(
                "w-5 h-5 transition-all duration-200",
                item.active ? "scale-110" : ""
              )}
            />
            {/* Label */}
            <span className="text-[10px] font-medium mt-0.5 truncate w-full text-center leading-tight">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

