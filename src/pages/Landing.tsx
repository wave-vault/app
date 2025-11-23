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
import { RoadmapSection } from "@/components/landing/RoadmapSection"
import { ThanksSection } from "@/components/landing/ThanksSection"
import { AnimatedWaveBackground } from "@/components/landing/AnimatedWaveBackground"

// Roadmap steps
const ROADMAP_STEPS = [
  'roadmap-step-1',
  'roadmap-step-2',
  'roadmap-step-3',
  'roadmap-step-4',
  'roadmap-step-5',
  'roadmap-step-6',
  'roadmap-step-7',
  'roadmap-step-8',
  'roadmap-step-9',
  'roadmap-step-10',
  'roadmap-step-11',
  'roadmap-step-12',
  'roadmap-step-13',
  'roadmap-step-14',
  'roadmap-step-15',
  'roadmap-step-16',
  'roadmap-step-17',
  'roadmap-step-18',
  'roadmap-step-19',
  'roadmap-step-20',
  'roadmap-step-21',
  'roadmap-step-22',
  'roadmap-step-23',
]

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
  'roadmap-section', // Badge "Future Brainstorming Ideas / Roadmap"
  ...ROADMAP_STEPS,
  'thanks-section',
]

export function Landing() {
  const [, setCurrentSectionIndex] = useState(0)

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
        // Se è un passo della roadmap, scrolla orizzontalmente
        if (sectionId.startsWith('roadmap-step-')) {
          const roadmapContainer = document.querySelector('.roadmap-carousel')
          if (roadmapContainer) {
            const containerRect = roadmapContainer.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()
            const scrollLeft = roadmapContainer.scrollLeft + (elementRect.left - containerRect.left) - (containerRect.width / 2) + (elementRect.width / 2)
            roadmapContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' })
          }
          // Scroll verticale per portare la sezione in vista
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          // Scroll normale per altre sezioni
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
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
        <RoadmapSection />
        <ThanksSection />
      </div>
      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  )
}
