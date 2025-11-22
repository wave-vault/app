import { Header } from "./Header"
import { MobileFooterNav } from "./MobileFooterNav"
import { Container } from "../atomic/Container"
import { AnimatedWaveBackground } from "../landing/AnimatedWaveBackground"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      <AnimatedWaveBackground />
      <Header />
      <div className="relative z-10">
        <main className="py-8 pb-20 md:pb-8">
          <Container maxWidth="2xl">
            {children}
          </Container>
        </main>
      </div>
      {/* Mobile Footer Navigation - only visible on mobile when wallet is connected */}
      <MobileFooterNav />
    </div>
  )
}

