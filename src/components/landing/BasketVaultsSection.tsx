import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Layers, Network, BarChart3, Zap } from "lucide-react"
import { VaultShowcaseCard } from "@/components/vault/VaultShowcaseCard"

export function BasketVaultsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-aqua-500/5 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <Layers className="w-3 h-3 mr-1" />
            Multi-Asset Vaults
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Permissionless Basket Vaults
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            Create multi-token vaults with configurable weights, fees, and rebalancing strategies. 
            Each vault operates as an independent liquidity pool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full px-4 sm:px-8 mb-12">
          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Network className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Virtual Liquidity</CardTitle>
            <CardDescription className="text-sm mb-3">
              Leverage Aqua Protocol's shared liquidity layer
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              Non-custodial architecture with up to 9x capital amplification through shared pools.
            </p>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Target Weights</CardTitle>
            <CardDescription className="text-sm mb-3">
              Define precise asset allocation
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              Configure target weights (e.g., 30% BTC, 30% ETH, 40% USDC) with automatic rebalancing.
            </p>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Pluggable Adapters</CardTitle>
            <CardDescription className="text-sm mb-3">
              Composable rebalancing strategies
            </CardDescription>
            <p className="text-xs text-muted-foreground">
              Permissionless execution via smart contract adapters with on-demand or threshold triggers.
            </p>
          </Card>
        </div>

        {/* Featured Vault Showcase */}
        <div id="featured-vault-section" className="w-full px-4 sm:px-8 scroll-mt-20">
          <div className="text-center mb-6">
            <Badge variant="outline" className="glass-apple mb-2">
              Featured Vault
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold">
              Example Multi-Asset Vault
            </h3>
          </div>
          <VaultShowcaseCard vaultAddress="0x6878d79f988e7ecb537016b93bb77b4d680e1f01" />
        </div>
      </Container>
    </section>
  )
}

