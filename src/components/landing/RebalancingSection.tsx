import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Activity } from "lucide-react"

export function RebalancingSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-aqua-500/5 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <Activity className="w-3 h-3 mr-1" />
            Continuous Rebalancing
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            On-Chain Rebalancing Engine
          </h2>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <Card variant="glass" className="p-6 sm:p-8">
            <CardContent className="space-y-6 p-0">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-aqua-500/20 flex items-center justify-center text-aqua-500 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Detect Deviation</h4>
                  <p className="text-xs text-muted-foreground">
                    Chainlink oracles provide real-time prices. Calculate deviation from target weights and trigger rebalancing when threshold exceeded.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-aqua-500/20 flex items-center justify-center text-aqua-500 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Calculate Swaps</h4>
                  <p className="text-xs text-muted-foreground">
                    Determine optimal swap sequence to restore target weights. Routes optimized via DEX aggregators.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-aqua-500/20 flex items-center justify-center text-aqua-500 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Execute via Aqua</h4>
                  <p className="text-xs text-muted-foreground">
                    Execute swaps using <code className="text-xs bg-aqua-500/10 px-1 rounded">pull()</code> and <code className="text-xs bg-aqua-500/10 px-1 rounded">push()</code> operations on virtual balances.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-aqua-500/20 flex items-center justify-center text-aqua-500 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Update Strategy</h4>
                  <p className="text-xs text-muted-foreground">
                    Generate new strategy hash with updated balances. Portfolio now matches target weights, IL reset to zero.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  )
}

