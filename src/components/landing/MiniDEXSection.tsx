import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Container } from "@/components/atomic/Container"
import { TrendingUp, Network, Shield } from "lucide-react"

export function MiniDEXSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start w-full px-4 sm:px-8">
          <Card variant="glass" className="p-6">
            <CardTitle className="text-xl mb-3">Unified Swap Interface</CardTitle>
            <CardContent className="space-y-4 p-0">
              <p className="text-xs text-muted-foreground">
                Aggregate all vaults into a single swap interface. Each vault exposes a mini-DEX through swap adapters, 
                enabling trading against rebalanced, IL-minimized positions.
              </p>
              <div className="space-y-3 pt-4">
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Standard AMM Interface</h4>
                  <p className="text-xs text-muted-foreground">
                    <code className="text-xs bg-aqua-500/10 px-1 rounded">swapExactIn()</code> and <code className="text-xs bg-aqua-500/10 px-1 rounded">swapExactOut()</code> route swaps through vault strategies with real-time price simulation.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Route Discovery</h4>
                  <p className="text-xs text-muted-foreground">
                    Find optimal routes across multiple vaults, aggregating liquidity for large swaps.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h3 className="text-2xl sm:text-3xl font-bold">Key Features</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-aqua-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Real-Time Pricing</h4>
                  <p className="text-xs text-muted-foreground">
                    Live price simulation using Aqua SDK with accurate previews before execution.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Network className="w-5 h-5 text-aqua-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Multi-Vault Aggregation</h4>
                  <p className="text-xs text-muted-foreground">
                    Split large swaps across vaults to maximize liquidity and minimize price impact.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-aqua-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1 text-sm">Slippage Protection</h4>
                  <p className="text-xs text-muted-foreground">
                    Configurable tolerance with transaction revert on price deviation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

