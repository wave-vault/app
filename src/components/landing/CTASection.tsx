import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
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
    <section className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <Rocket className="w-3 h-3 mr-1" />
            Get Started
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Choose Your Role
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            Whether you're a market maker, liquidity provider, or trader, Wave offers tools for every DeFi participant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full px-4 sm:px-8 mb-8">
          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors p-6">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Swap Tokens</CardTitle>
            <CardDescription className="text-sm mb-4">
              Access the full Wave swap interface
            </CardDescription>
            <p className="text-xs text-muted-foreground mb-4">
              Swap tokens, monitor positions, and manage vaults from a unified interface.
            </p>
            <Button className="w-full text-sm" variant="glass-apple" asChild>
              <Link to="/swap">
                Go to Swap
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors p-6">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <UserCog className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Become a Manager</CardTitle>
            <CardDescription className="text-sm mb-4">
              Create vaults & be a market maker
            </CardDescription>
            <p className="text-xs text-muted-foreground mb-4">
              Deploy permissionless vaults, configure weights and fees, earn management revenue.
            </p>
            <Button className="w-full text-sm" variant="glass-apple" asChild>
              <Link to="/create-vault">
                Create Vault
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 hover:border-aqua-500/40 transition-colors p-6">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Liquidity Provider</CardTitle>
            <CardDescription className="text-sm mb-4">
              Deposit assets & earn yields
            </CardDescription>
            <p className="text-xs text-muted-foreground mb-4">
              Deposit into vaults, receive shares, benefit from zero impermanent loss.
            </p>
            <Button className="w-full text-sm" variant="glass-apple" asChild>
              <Link to="/vaults" onClick={handleAddLiquidityClick}>
                Add Liquidity
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </Card>
        </div>

        <div className="text-center pt-8 border-t border-aqua-500/20 w-full px-4 sm:px-8">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Built on{" "}
            <a
              href="https://1inch.com/aqua"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-500 hover:text-aqua-400 underline transition-colors"
            >
              1inch Aqua Protocol
            </a>
            {" • "}
            Automated by{" "}
            <a
              href="https://chain.link"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-500 hover:text-aqua-400 underline transition-colors"
            >
              Chainlink Oracles
            </a>
            {" • "}
            Powered by{" "}
            <a
              href="https://factor.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aqua-500 hover:text-aqua-400 underline transition-colors"
            >
              Factor Studio
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

