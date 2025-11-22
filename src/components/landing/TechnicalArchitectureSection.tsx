import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Lock } from "lucide-react"

export function TechnicalArchitectureSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <Lock className="w-3 h-3 mr-1" />
            Architecture
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Built on Immutable Smart Contracts
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 w-full px-4 sm:px-8">
          <Card variant="glass" className="p-6">
            <CardTitle className="text-xl mb-3">ERC-4626 Vaults</CardTitle>
            <CardContent className="space-y-4 p-0">
              <div>
                <h4 className="font-semibold mb-2 text-aqua-500 text-sm">Permissionless Creation</h4>
                <p className="text-xs text-muted-foreground">
                  Deploy vaults with configurable tokens, pairs, fees, and target weights.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-aqua-500 text-sm">Share-Based Ownership</h4>
                <p className="text-xs text-muted-foreground">
                  ERC-20 shares represent proportional ownership with oracle-based valuation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="p-6">
            <CardTitle className="text-xl mb-3">Aqua Protocol</CardTitle>
            <CardContent className="space-y-4 p-0">
              <div>
                <h4 className="font-semibold mb-2 text-aqua-500 text-sm">Virtual Liquidity</h4>
                <p className="text-xs text-muted-foreground">
                  Initialize strategies with <code className="text-xs bg-aqua-500/10 px-1 rounded">ship()</code> and manage via <code className="text-xs bg-aqua-500/10 px-1 rounded">pull()</code>/<code className="text-xs bg-aqua-500/10 px-1 rounded">push()</code> operations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-aqua-500 text-sm">Real-Time Queries</h4>
                <p className="text-xs text-muted-foreground">
                  Query virtual balances for portfolio composition tracking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </section>
  )
}

