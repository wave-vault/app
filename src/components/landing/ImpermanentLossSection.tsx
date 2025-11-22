import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Shield } from "lucide-react"

export function ImpermanentLossSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center w-full px-4 sm:px-8 lg:px-12">
          <div className="space-y-4">
            <Badge variant="outline" className="glass-apple">
              <Shield className="w-3 h-3 mr-1" />
              Zero Impermanent Loss
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Continuous Rebalancing Eliminates IL
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Real-time on-chain rebalancing maintains target weights through oracle-driven price feeds, 
              neutralizing impermanent loss through dynamic position management.
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
      </Container>
    </section>
  )
}

