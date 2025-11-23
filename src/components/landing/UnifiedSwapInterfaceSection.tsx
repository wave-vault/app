import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { ArrowLeftRight, Route, Shield, Zap, TrendingUp } from "lucide-react"

export function UnifiedSwapInterfaceSection() {
  return (
    <section id="unified-swap-section" className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <ArrowLeftRight className="w-3 h-3 mr-1" />
            Unified Swap Interface
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Unified Swap Interface
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            Aggregate all vaults into a single swap interface. Each vault exposes a mini-DEX through swap adapters, 
            enabling trading against rebalanced, IL-minimized positions.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Standard AMM Interface */}
            <Card variant="glass" className="border-aqua-500/20 p-6">
              <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-aqua-500" />
              </div>
              <CardTitle className="text-lg mb-2">Standard AMM Interface</CardTitle>
              <CardDescription className="text-sm">
                <code className="text-xs bg-aqua-500/10 px-1.5 py-0.5 rounded">swapExactIn()</code> and{" "}
                <code className="text-xs bg-aqua-500/10 px-1.5 py-0.5 rounded">swapExactOut()</code> route swaps 
                through vault strategies with real-time price simulation.
              </CardDescription>
            </Card>

            {/* Route Discovery */}
            <Card variant="glass" className="border-aqua-500/20 p-6">
              <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
                <Route className="w-6 h-6 text-aqua-500" />
              </div>
              <CardTitle className="text-lg mb-2">Route Discovery</CardTitle>
              <CardDescription className="text-sm">
                Find optimal routes across multiple vaults, aggregating liquidity for large swaps.
              </CardDescription>
            </Card>
          </div>

          {/* Key Features */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center mb-6">Key Features</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card variant="glass" className="border-aqua-500/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-aqua-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-aqua-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1.5 text-sm">Real-Time Pricing</h4>
                    <p className="text-xs text-muted-foreground">
                      Live price simulation using Aqua SDK with accurate previews before execution.
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="border-aqua-500/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-aqua-500/10 flex items-center justify-center flex-shrink-0">
                    <Route className="w-5 h-5 text-aqua-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1.5 text-sm">Multi-Vault Aggregation</h4>
                    <p className="text-xs text-muted-foreground">
                      Split large swaps across vaults to maximize liquidity and minimize price impact.
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="border-aqua-500/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-aqua-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-aqua-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1.5 text-sm">Slippage Protection</h4>
                    <p className="text-xs text-muted-foreground">
                      Configurable tolerance with transaction revert on price deviation.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

