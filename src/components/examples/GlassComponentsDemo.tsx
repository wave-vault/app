import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Demo component che mostra tutti i componenti glassmorphism disponibili
 * Questo file può essere usato come riferimento per vedere come implementare
 * i componenti glass nel progetto Wave
 */
export function GlassComponentsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Liquid Glass Components Demo</h1>

        {/* Cards Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard shadcn/ui card</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This is a default card without glass effect.</p>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Standard glass effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card has a glass effect with blur.</p>
              </CardContent>
            </Card>

            <Card variant="glass-strong">
              <CardHeader>
                <CardTitle>Strong Glass</CardTitle>
                <CardDescription>Stronger glass effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card has a stronger glass effect.</p>
              </CardContent>
            </Card>

            <Card variant="glass-apple" className="glass-hover">
              <CardHeader>
                <CardTitle>Apple Glass</CardTitle>
                <CardDescription>Apple-inspired liquid glass</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This card has Apple-style liquid glass with hover effect.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="glass">Glass Button</Button>
            <Button variant="glass-apple">Apple Glass</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm text-foreground/80">Default Input</label>
              <Input placeholder="Enter text..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-foreground/80">Glass Input</label>
              <Input variant="glass" placeholder="Enter text with glass effect..." />
            </div>
          </div>
        </section>

        {/* Vault Card Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Vault Card Example</h2>
          <Card variant="glass-apple" className="glass-hover max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>VAULT</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>DeFi Yield Vault</CardTitle>
                  <CardDescription>Multi-token liquidity pool</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">TVL</p>
                    <p className="text-2xl font-bold">$1,234,567</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">APY</p>
                    <p className="text-2xl font-bold text-green-500">12.5%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Composition</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">ETH</Badge>
                    <Badge variant="secondary">USDC</Badge>
                    <Badge variant="secondary">WBTC</Badge>
                    <Badge variant="outline">+3 more</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="glass" className="flex-1">View Details</Button>
              <Button variant="glass-apple" className="flex-1">Deposit</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Tabs Example */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Tabs with Glass</h2>
          <Card variant="glass-apple" className="max-w-2xl">
            <CardHeader>
              <CardTitle>Vault Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="glass">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="strategy">Strategy</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                  <p className="text-sm">Overview content goes here...</p>
                </TabsContent>
                <TabsContent value="strategy" className="mt-4">
                  <p className="text-sm">Strategy details...</p>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <p className="text-sm">Transaction history...</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Utility Classes Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Utility Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-xl">
              <h3 className="font-semibold mb-2">.glass</h3>
              <p className="text-sm text-muted-foreground">Standard glass effect</p>
            </div>
            <div className="glass-strong p-6 rounded-xl">
              <h3 className="font-semibold mb-2">.glass-strong</h3>
              <p className="text-sm text-muted-foreground">Stronger glass effect</p>
            </div>
            <div className="glass-apple p-6 rounded-xl">
              <h3 className="font-semibold mb-2">.glass-apple</h3>
              <p className="text-sm text-muted-foreground">Apple-style liquid glass</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}






