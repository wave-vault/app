import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Activity, Rocket } from "lucide-react"
import logoImage from "@/logo/logo.png"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-aqua-500/10 via-transparent to-aqua-600/5" />
      <Container maxWidth="full" className="relative py-16 sm:py-20 md:py-24 lg:py-32 xl:py-40">
        <div className="text-center space-y-8 sm:space-y-10 md:space-y-12 w-full">
          <Badge variant="outline" className="glass-apple border-aqua-500/30">
            <Activity className="w-3 h-3 mr-1" />
            Built on 1inch Aqua Protocol
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight w-full flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-black dark:text-white font-bold h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28 leading-none flex items-center">1</span>
              <img
                src={logoImage}
                alt="Wave Logo"
                className="h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-auto"
              />
            </div>
            <span className="text-foreground">Liquidity-as-a-Service</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-5xl mx-auto leading-relaxed w-full px-4 sm:px-8 lg:px-12 xl:px-16">
            Permissionless basket asset vaults with <span className="text-aqua-500 font-semibold">zero impermanent loss</span> through 
            continuous on-chain rebalancing and virtual liquidity aggregation via Aqua Protocol
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 px-4 sm:px-0">
            <Button size="lg" variant="glass-apple" className="w-full sm:w-auto text-base sm:text-lg px-8 py-6" asChild>
              <Link to="/swap">
                <Rocket className="mr-2 h-5 w-5" />
                Open App
              </Link>
            </Button>
            <Button size="lg" variant="glass-apple" className="w-full sm:w-auto text-base sm:text-lg px-8 py-6" asChild>
              <Link to="/vaults">
                Explore Vaults
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}

