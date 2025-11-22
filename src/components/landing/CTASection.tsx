import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Rocket, UserCog, Coins, ArrowRight } from "lucide-react"
import { useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"

export function CTASection() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  const handleAddLiquidityClick = (e: React.MouseEvent) => {
    if (!isConnected && openConnectModal) {
      e.preventDefault()
      openConnectModal()
    }
  }
  return (
    <section className="py-20 sm:py-24 md:py-32 lg:py-40 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-16 sm:mb-20 md:mb-24 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <Badge variant="outline" className="glass-apple mb-6">
            <Rocket className="w-3 h-3 mr-1" />
            Get Started
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 w-full">
            Choose Your Role in the Wave Ecosystem
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-5xl mx-auto w-full">
            Whether you're a market maker, liquidity provider, or trader, Wave offers tools for every DeFi participant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 w-full mb-16 sm:mb-20 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors">
            <CardHeader className="p-10">
              <div className="w-16 h-16 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-aqua-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl mb-3">Open App</CardTitle>
              <CardDescription className="text-base">
                Access the full Wave swap interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-10 pt-0">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Explore all features, swap tokens, monitor your positions, view analytics, and manage your vaults from a unified interface.
              </p>
              <Button className="w-full text-base" variant="glass-apple" asChild>
                <Link to="/swap">
                  Go to Swap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors">
            <CardHeader className="p-10">
              <div className="w-16 h-16 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-6">
                <UserCog className="w-8 h-8 text-aqua-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl mb-3">Become a Manager</CardTitle>
              <CardDescription className="text-base">
                Create vaults & be a market maker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-10 pt-0">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Deploy permissionless basket asset vaults, configure target weights, set fee structures, and earn management fees while providing liquidity through Aqua Protocol strategies.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
                <li>Create multi-asset vaults</li>
                <li>Configure rebalancing strategies</li>
                <li>Earn management fees</li>
                <li>Permissionless deployment</li>
              </ul>
              <Button className="w-full text-base" variant="glass-apple" asChild>
                <Link to="/create-vault">
                  Create Vault
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors">
            <CardHeader className="p-10">
              <div className="w-16 h-16 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-6">
                <Coins className="w-8 h-8 text-aqua-500" />
              </div>
              <CardTitle className="text-xl sm:text-2xl mb-3">Liquidity Provider</CardTitle>
              <CardDescription className="text-base">
                Deposit assets & earn yields
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-10 pt-0">
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                Deposit tokens into existing vaults, receive shares representing your proportional ownership, and benefit from zero impermanent loss through continuous rebalancing.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside mb-4">
                <li>Zero impermanent loss</li>
                <li>Earn swap fees</li>
                <li>Flexible withdrawals</li>
                <li>Share-based ownership</li>
              </ul>
              <Button className="w-full text-base" variant="glass-apple" asChild>
                <Link to="/vaults" onClick={handleAddLiquidityClick}>
                  Add Liquidity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center pt-12 border-t border-white/10 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <p className="text-sm sm:text-base text-muted-foreground">
            Built on{" "}
            <a
              href="https://1inch.com/aqua"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-500 hover:text-aqua-400 font-semibold underline underline-offset-2 transition-colors"
            >
              1inch Aqua Protocol
            </a>
            {" • "}
            Powered by{" "}
            <a
              href="https://chain.link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-500 hover:text-aqua-400 font-semibold underline underline-offset-2 transition-colors"
            >
              Chainlink Oracles
            </a>
            {" • "}
            <strong className="text-foreground">Permissionless</strong> &{" "}
            <strong className="text-foreground">Composable</strong>
          </p>
        </div>
      </Container>
    </section>
  )
}

