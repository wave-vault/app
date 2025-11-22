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
import { AnimatedWaveBackground } from "@/components/landing/AnimatedWaveBackground"

export function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      <AnimatedWaveBackground />
      <Header />
      <div className="relative z-10">
        <HeroSection />
        <ImpermanentLossSection />
        <FeaturesChips />
        <BasketVaultsSection />
        <TechnicalArchitectureSection />
        <FactorSDKSection />
        <RebalancingSection />
        <MiniDEXSection />
        <CTASection />
      </div>
      {/* Mobile Footer Navigation */}
      <MobileFooterNav />
    </div>
  )
}
