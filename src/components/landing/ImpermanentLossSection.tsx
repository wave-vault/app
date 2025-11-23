import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Shield } from "lucide-react"

export function ImpermanentLossSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="space-y-8 sm:space-y-12 w-full px-4 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="glass-apple">
                <Shield className="w-3 h-3 mr-1" />
                High Capital Efficiency
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Optimal Basket Balance Through Continuous Rebalancing
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Our intelligent rebalancing system creates exceptional capital efficiency by continuously 
                optimizing the token basket composition. Through real-time on-chain rebalancing powered by 
                oracle-driven price feeds, we maintain the optimal balance between all tokens in the basket, 
                ensuring your portfolio always reflects the best possible allocation.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                This dynamic approach not only eliminates impermanent loss but maximizes capital utilization 
                by automatically adjusting positions to maintain target weights, ensuring every token in your 
                basket contributes optimally to portfolio performance.
              </p>
            </div>

            <Card variant="glass" className="p-6">
              <CardContent className="space-y-4 p-0">
                <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <span className="font-medium text-sm">Traditional AMM</span>
                  <Badge variant="destructive">2-5% IL</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-aqua-500/10 border border-primary/20">
                  <span className="font-medium text-sm">Wave Vaults</span>
                  <Badge className="bg-primary">~0% IL</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  )
}

