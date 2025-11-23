import { Card, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/atomic/Container"
import { Code, Coins, Settings, TrendingUp } from "lucide-react"

export function FactorSDKSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-aqua-500/5 w-full">
      <Container maxWidth="full" className="w-full">
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge variant="outline" className="glass-apple mb-4">
            <Code className="w-3 h-3 mr-1" />
            Powered by Factor Studio SDK
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Create & Manage Vaults
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Deploy ERC-4626-compliant vaults with full control over configuration and fee structures. 
            Set up your vaults with custom token baskets, target weights, and fee parameters, then 
            automatically earn revenue from all deposit, withdrawal, and management operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full px-4 sm:px-8">
          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">ERC-4626 Standard</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Industry-standard vault interface ensuring full DeFi compatibility. Your vaults integrate 
              seamlessly with existing DeFi protocols, wallets, and infrastructure, providing maximum 
              interoperability across the ecosystem.
            </p>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Configure Fees</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Set deposit, withdrawal, management, and performance fees with complete flexibility. 
              Customize your fee structure to align with your vault strategy and revenue goals, 
              with all fees automatically collected and distributed.
            </p>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Earn Revenue</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Collect fees from all vault operations automatically. Every deposit, withdrawal, and 
              rebalancing action generates revenue based on your configured fee structure, creating 
              a sustainable income stream from your vault operations.
            </p>
          </Card>

          <Card variant="glass" className="border-aqua-500/20 p-5">
            <div className="w-12 h-12 rounded-lg bg-aqua-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-aqua-500" />
            </div>
            <CardTitle className="text-lg mb-2">Battle-Tested SDK</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built on proven Factor Studio infrastructure with security best practices. Leverage 
              a production-ready SDK that has been thoroughly tested and audited, ensuring your 
              vaults are secure, reliable, and ready for deployment.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  )
}



