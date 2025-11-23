import { Container } from "@/components/atomic/Container"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Puzzle, 
  Route, 
  Layers, 
  CreditCard, 
  Eye, 
  DollarSign, 
  AlertTriangle, 
  Lock, 
  Users, 
  BarChart3, 
  FileCheck, 
  MousePointerClick, 
  Settings,
  Rocket
} from "lucide-react"

const roadmapSteps = [
  // HIGH PRIORITY
  {
    id: 'roadmap-step-1',
    category: 'Top-Priority Ideas',
    title: 'Internal-swap on deposit',
    description: 'When a user deposits a single token, perform the conversion using liquidity already inside the vault (internal swap) instead of removing positions and re-adding externally.',
    deliverable: 'Internal-swap adapter + deposit flow that mints shares immediately based on internal valuation; fallback to on‑market adapters if internal liquidity is insufficient.',
    impact: 'One-click UX for small LPs, lower gas, lower slippage, fewer external on-chain moves.',
    icon: Zap,
    priority: 'high'
  },
  {
    id: 'roadmap-step-2',
    category: 'Top-Priority Ideas',
    title: 'Share valuation using internal/spot price',
    description: 'Compute shares at deposit using vault internal state and/or short-lived spot prices (off-chain feeder) rather than relying only on delayed on‑chain oracles.',
    deliverable: 'Valuation function (vault, token, amount) + fallback hierarchy (internal state → short TWAP → aggregated oracles).',
    impact: 'Fairer immediate minting, reduced vulnerability to oracle-lag attacks.',
    icon: TrendingUp,
    priority: 'high'
  },
  {
    id: 'roadmap-step-3',
    category: 'Top-Priority Ideas',
    title: 'Multi-block decay / short TWAP protections',
    description: 'Protect sensitive operations (deposit/withdraw/rebalance) using a configurable decay window (seconds or blocks) and/or a short-term TWAP to prevent deposit-withdraw exploit patterns.',
    deliverable: 'DecayPeriod parameter per vault; enforcement on operations; logs for blocked attempts.',
    impact: 'Mitigates front-running and price-manipulation exploits.',
    icon: Shield,
    priority: 'high'
  },
  {
    id: 'roadmap-step-4',
    category: 'Risk Controls & Protections',
    title: 'Min/max deposit and rate limits',
    description: 'Enforce per-address and per-tx rate limits and min/max deposit caps to reduce attack surface for deposit-withdraw manipulation.',
    deliverable: 'Configurable limits enforced in core deposit/withdraw logic and events for limit breaches.',
    impact: 'Reduces flash exploit vectors.',
    icon: Shield,
    priority: 'high'
  },
  {
    id: 'roadmap-step-5',
    category: 'Risk Controls & Protections',
    title: 'Emergency pause / stop-the-world protections',
    description: 'Emergency pause mechanisms and on-chain checks that can freeze operations if anomalous conditions are observed.',
    deliverable: 'Pausable modules, guardian multisig hooks, alerts for anomalous metrics.',
    impact: 'Improved operational safety.',
    icon: AlertTriangle,
    priority: 'high'
  },
  {
    id: 'roadmap-step-6',
    category: 'Security & Testing',
    title: 'Audit-first mindset and modular formal verification',
    description: 'Design with smaller audit scopes (core accounting, adapters, oracles) and plan multiple audits + bug bounty; consider formal verification for accounting primitives.',
    deliverable: 'Audit checklist per module, modularization to reduce audit surface.',
    impact: 'Stronger security posture and market confidence.',
    icon: Lock,
    priority: 'high'
  },
  {
    id: 'roadmap-step-7',
    category: 'Security & Testing',
    title: 'Comprehensive test cases (edge scenarios)',
    description: 'Test scenarios that include extreme price swings, oracle desync, rapid deposit/withdraw sequences, and adapter failures.',
    deliverable: 'Integration tests, fuzzing, simulated adversarial test harness.',
    impact: 'Reduces production surprises.',
    icon: FileCheck,
    priority: 'high'
  },
  // MEDIUM PRIORITY
  {
    id: 'roadmap-step-8',
    category: 'Modularity & Adapters',
    title: 'Pluggable adapter architecture',
    description: 'Standard adapter interface allowing modular swap adapters (Uniswap V3, aggregators), lending adapters (Aave, Compound, Morpho), and oracle adapters.',
    deliverable: 'Adapter interface + registry + fallback chaining logic (internal → preferred adapter → fallback).',
    impact: 'Extensibility, easier integration of new protocols and improved resilience.',
    icon: Puzzle,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-9',
    category: 'Modularity & Adapters',
    title: 'Fallback chaining for swaps',
    description: 'Try internal liquidity first, then preferred DEX/aggregator, then other fallback adapters in a configurable order.',
    deliverable: 'Chained swap executor with slippage and liquidity checks.',
    impact: 'Reliable execution with minimized cost/slippage.',
    icon: Route,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-10',
    category: 'Strategy & Liquidity Reuse',
    title: 'Multi-strategy vaults and liquidity reuse',
    description: 'Allow a vault\'s liquidity to be used by multiple strategies (e.g., concentrated LP + lending + tactical swaps) and let strategies compose.',
    deliverable: 'Per-strategy accounting, exposure tracking, UI that shows which strategies share liquidity.',
    impact: 'Higher capital efficiency and richer product offerings.',
    icon: Layers,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-11',
    category: 'Strategy & Liquidity Reuse',
    title: 'Concentrated vs full-range policy templates',
    description: 'Provide vault templates (full-range, wide-range, concentrated) with recommended default parameters for different risk/profit profiles.',
    deliverable: 'Deployable templates and migration tools to change strategy type safely.',
    impact: 'Easier product creation and clearer user expectations.',
    icon: Settings,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-12',
    category: 'Oracles & Pricing',
    title: 'Expandable oracle manager & share-price standard',
    description: 'Create an OracleManager that aggregates multiple feeds (Chainlink + custom + off-chain) with weights and decay, plus a standard for publishing vault share prices.',
    deliverable: 'Oracle aggregator, API/registry for registering new feeds, share-price getter standard for vaults.',
    impact: 'Broader token coverage and more resilient pricing.',
    icon: Eye,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-13',
    category: 'Oracles & Pricing',
    title: 'Curve-like pricing for stable-stable pairs',
    description: 'Use Curve-style invariant or other bonding curves for stable-stable pools instead of simple XY=K to reduce slippage for stable pairs.',
    deliverable: 'Optional math library for Curve-like invariant, configurability per vault.',
    impact: 'Better capital efficiency and less slippage for stablecoin vaults.',
    icon: TrendingUp,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-14',
    category: 'Risk Controls & Protections',
    title: 'Liquidity availability checks before swaps',
    description: 'Before executing internal swaps, confirm sufficient liquidity and enforce slippage bounds; if not met, fallback to safer route or reject.',
    deliverable: 'Pre-swap liquidity probe + rejection/fallback logic.',
    impact: 'Prevents failed or costly swaps.',
    icon: Shield,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-15',
    category: 'Monitoring & Observability',
    title: 'Metrics and dashboards',
    description: 'Provide dashboards showing TVL, fees per share, strategy performance, share-price oracles, and alerts for outliers.',
    deliverable: 'Metrics exporter, alert rules, public monitoring dashboard.',
    impact: 'Better transparency and quicker incident response.',
    icon: BarChart3,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-16',
    category: 'Monitoring & Observability',
    title: 'Event logging & on-chain observability',
    description: 'Emit rich events for deposit, withdraw, adapter calls, oracle updates, and exception conditions to enable off-chain monitoring and replay.',
    deliverable: 'Standardized event schema and indexing-ready logs.',
    impact: 'Easier analytics and forensic investigation.',
    icon: Eye,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-17',
    category: 'UX and Onboarding',
    title: 'One-click vaults and clear share/accounting transparency',
    description: 'Provide "one-click" vaults for common pairs with clear explanation of how shares are calculated, estimated fees, and expected behaviors.',
    deliverable: 'UI flows with estimated share minting preview, gas and slippage estimates, demo/test-mode banners.',
    impact: 'Better adoption from small LPs and hackathon/demo users.',
    icon: MousePointerClick,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-18',
    category: 'UX and Onboarding',
    title: 'UI for multi-strategy visibility and risk indicators',
    description: 'Show which strategies use the same liquidity, expected fee splits, and simple risk indicators per vault.',
    deliverable: 'UI components for strategy composition and risk badges.',
    impact: 'User trust and clarity.',
    icon: Users,
    priority: 'medium'
  },
  {
    id: 'roadmap-step-19',
    category: 'Miscellaneous Enhancements',
    title: 'Modular SDK and adapter onboarding docs',
    description: 'Publish a simple SDK and adapter integration guide so third parties can build adapters or strategies against 1wave.',
    deliverable: 'SDK, examples, and docs.',
    impact: 'Ecosystem growth and faster integrations.',
    icon: Rocket,
    priority: 'medium'
  },
  // LOW PRIORITY
  {
    id: 'roadmap-step-20',
    category: 'Credit and Composability',
    title: 'Cross-vault credit lines',
    description: 'Allow one vault to extend a line of credit to another vault using shares as collateral and using a share-price oracle for pricing.',
    deliverable: 'Credit adapter, share-price oracle standard, liquidation rules, and risk controls.',
    impact: 'Enables internal liquidity leverage and new composability but requires careful risk controls.',
    icon: CreditCard,
    priority: 'low'
  },
  {
    id: 'roadmap-step-21',
    category: 'Credit and Composability',
    title: 'Strategy allowance / cross-vault strategy access',
    description: 'Let one vault grant allowance to strategies of another vault (or reuse strategy implementations), enabling shared strategies across vaults.',
    deliverable: 'Permission model, allowance management, audit logs.',
    impact: 'Simpler product reuse and faster rollout of new strategies.',
    icon: Layers,
    priority: 'low'
  },
  {
    id: 'roadmap-step-22',
    category: 'Rewards & Growth',
    title: 'Points/reward system for contributors and LPs',
    description: 'Implement a points system to reward liquidity providers, swap volume, or vault creators; points can map to rewards, fee discounts, or governance weight.',
    deliverable: 'Reward engine, distribution schedule, claim UI.',
    impact: 'User acquisition and retention (requires tokenomics & treasury).',
    icon: DollarSign,
    priority: 'low'
  },
  {
    id: 'roadmap-step-23',
    category: 'Miscellaneous Enhancements',
    title: 'Parametrizable decay and per-chain tuning',
    description: 'Allow decay/TWAP and other timing protections to be tuned per chain to reflect block times.',
    deliverable: 'Per-chain configuration options and safe defaults.',
    impact: 'More accurate protections across different L1/L2 environments.',
    icon: Settings,
    priority: 'low'
  },
]

export function RoadmapSection() {
  const priorityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-blue-500/30 bg-blue-500/5',
  }
  const priorityLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 w-full bg-gradient-to-b from-background via-aqua-500/5 to-background">
      <Container maxWidth="full" className="w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 w-full px-4 sm:px-8">
          <Badge id="roadmap-section" variant="outline" className="glass-apple mb-4 scroll-mt-20">
            <Rocket className="w-3 h-3 mr-1" />
            Future Brainstorming Ideas / Roadmap
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Roadmap
          </h2>
        </div>

        {/* Horizontal Carousel/Gallery */}
        <div className="w-full overflow-x-auto pb-4 px-4 sm:px-8 scrollbar-hide roadmap-carousel" style={{ scrollBehavior: 'smooth' }}>
          <div className="flex gap-4 sm:gap-6 min-w-max py-2">
            {roadmapSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  id={step.id}
                  className="scroll-mt-20 flex-shrink-0 w-80 sm:w-96"
                >
                  <Card variant="glass" className={`border-aqua-500/20 p-4 sm:p-5 h-full flex flex-col ${priorityColors[step.priority as keyof typeof priorityColors]}`}>
                    <CardContent className="p-0 space-y-3 flex-1 flex flex-col">
                      {/* Header with Icon and Priority */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-aqua-500/20 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-aqua-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <Badge 
                                variant={step.priority === 'high' ? 'destructive' : step.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-[10px] px-1.5 py-0 h-4"
                              >
                                {priorityLabels[step.priority as keyof typeof priorityLabels]}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                #{index + 1}
                              </span>
                            </div>
                            <CardTitle className="text-sm sm:text-base font-bold line-clamp-2 leading-tight">
                              {step.title}
                            </CardTitle>
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 w-fit">
                        {step.category}
                      </Badge>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                        {step.description}
                      </p>

                      {/* Deliverable - Compact */}
                      <div className="space-y-1 pt-2 border-t border-border/20">
                        <h4 className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Deliverable
                        </h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {step.deliverable}
                        </p>
                      </div>

                      {/* Impact - Compact */}
                      <div className="space-y-1">
                        <h4 className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Impact
                        </h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {step.impact}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </Container>
    </section>
  )
}

