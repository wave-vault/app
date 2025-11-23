import { useEffect, useState } from "react"
import { Header } from "@/components/layout/Header"
import { MobileFooterNav } from "@/components/layout/MobileFooterNav"
import { HeroSection } from "@/components/landing/HeroSection"
import { ImpermanentLossSection } from "@/components/landing/ImpermanentLossSection"
import { FeaturesChips } from "@/components/landing/FeaturesChips"
import { BasketVaultsSection } from "@/components/landing/BasketVaultsSection"
import { TechnicalArchitectureSection } from "@/components/landing/TechnicalArchitectureSection"
import { FactorSDKSection } from "@/components/landing/FactorSDKSection"
import { RebalancingSection } from "@/components/landing/RebalancingSection"
import { MiniDEXSection } from "@/components/landing/MiniDEXSection"
import { CTASection } from "@/components/landing/CTASection"
import { UnifiedSwapInterfaceSection } from "@/components/landing/UnifiedSwapInterfaceSection"
import { ThanksSection } from "@/components/landing/ThanksSection"
import { AnimatedWaveBackground } from "@/components/landing/AnimatedWaveBackground"

// Sezioni navigabili in ordine
const SECTIONS = [
  'hero-section',
  'cta-section',
  'impermanent-loss-section',
  'basket-vaults-section',
  'featured-vault-section',
  'architecture-section',
  'factor-sdk-section',
  'rebalancing-section',
  'unified-swap-section',
  'thanks-section',
]

export function Landing() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se l'utente sta digitando in un input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setCurrentSectionIndex((prev) => {
          const nextIndex = Math.min(prev + 1, SECTIONS.length - 1)
          scrollToSection(nextIndex)
          return nextIndex
        })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setCurrentSectionIndex((prev) => {
          const prevIndex = Math.max(prev - 1, 0)
          scrollToSection(prevIndex)
          return prevIndex
        })
      }
    }

    const scrollToSection = (index: number) => {
      const sectionId = SECTIONS[index]
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      <AnimatedWaveBackground />
      <Header />
      <div className="relative z-10">
        <div id="hero-section">
          <HeroSection />
        </div>
        <div id="cta-section">
          <CTASection />
        </div>
        <div id="impermanent-loss-section">
          <ImpermanentLossSection />
        </div>
        <FeaturesChips />
        <div id="basket-vaults-section">
          <BasketVaultsSection />
        </div>
        <div id="architecture-section">
          <TechnicalArchitectureSection />
        </div>
        <div id="factor-sdk-section">
          <FactorSDKSection />
        </div>
        <div id="rebalancing-section">
          <RebalancingSection />
        </div>
        <UnifiedSwapInterfaceSection />
        <MiniDEXSection />
        <ThanksSection />
      </div>
      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  )
}
