import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/atomic/Container"

export function FeaturesChips() {
  return (
    <section className="py-8 sm:py-12 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full px-4 sm:px-8">
          <Card variant="glass-apple" className="rounded-xl p-4 border border-aqua-500/20 hover:border-aqua-500/40 transition-all flex-1">
            <CardContent className="p-0 text-center">
              <h3 className="font-semibold text-sm text-foreground mb-1">Oracle-Based Pricing</h3>
              <p className="text-xs text-muted-foreground">
                Chainlink price feeds provide real-time, accurate market data that enables precise rebalancing triggers, ensuring optimal portfolio performance and minimizing slippage.
              </p>
            </CardContent>
          </Card>
          
          <Card variant="glass-apple" className="rounded-xl p-4 border border-aqua-500/20 hover:border-aqua-500/40 transition-all flex-1">
            <CardContent className="p-0 text-center">
              <h3 className="font-semibold text-sm text-foreground mb-1">Auto Rebalancing</h3>
              <p className="text-xs text-muted-foreground">
                Automatically maintains optimal basket balance by continuously aligning asset weights with target allocations, ensuring maximum capital efficiency and the best possible token composition at all times.
              </p>
            </CardContent>
          </Card>

          <Card variant="glass-apple" className="rounded-xl p-4 border border-aqua-500/20 hover:border-aqua-500/40 transition-all flex-1">
            <CardContent className="p-0 text-center">
              <h3 className="font-semibold text-sm text-foreground mb-1">Virtual Liquidity</h3>
              <p className="text-xs text-muted-foreground">
                Leverages Aqua Protocol's virtual liquidity pools to execute capital-efficient swaps without requiring traditional liquidity providers, reducing costs and improving execution.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  )
}

