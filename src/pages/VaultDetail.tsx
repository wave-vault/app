import { useParams } from "react-router-dom"
import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { VaultActions } from "@/components/vault/VaultActions"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { fetchVaultByAddress, AggregatedVault } from "@/services/vaultService"
import { useVaultUserShares } from "@/hooks/useVaultUserShares"
import { Address } from "viem"
import { FactorTokenlist } from "@factordao/tokenlist"
import { BASE_WHITELISTED_TOKENS } from "@/lib/constants/baseTokens"
import { useAccount } from "wagmi"

const STATS_API_BASE_URL = import.meta.env.VITE_STATS_API_BASE_URL || ""

// Format fee from string (could be in wei or already a percentage)
function formatFee(fee?: string): string {
  if (!fee || fee === "0") return "0%"
  
  const feeNum = parseFloat(fee)
  if (isNaN(feeNum)) return "N/A"
  
  // If it's a very large number (likely in wei), convert it
  if (feeNum > 1000000) {
    // Assume 18 decimals (wei format) - convert to percentage
    const percentage = (feeNum / 1e18) * 100
    return percentage < 0.01 ? "0%" : `${percentage.toFixed(2)}%`
  }
  
  // If it's already a reasonable percentage (0-100), use it directly
  if (feeNum <= 100) {
    return feeNum < 0.01 ? "0%" : `${feeNum.toFixed(2)}%`
  }
  
  // Otherwise, assume it's in basis points (divide by 100)
  return `${(feeNum / 100).toFixed(2)}%`
}

interface VaultDetail extends AggregatedVault {
  tokens?: Array<{
    address: string
    symbol: string
    name: string
    logoURI?: string
    decimals: number
    isDepositAsset?: boolean
    isWithdrawAsset?: boolean
  }>
}

async function fetchVaultDetail(address: string): Promise<VaultDetail | null> {
  if (!STATS_API_BASE_URL) {
    console.warn("VITE_STATS_API_BASE_URL not set")
    return null
  }

  try {
    // Try to fetch from aggregated service first
    const aggregatedVault = await fetchVaultByAddress(address)
    if (aggregatedVault) {
      // Transform to VaultDetail format
      const depositTokens = aggregatedVault.depositTokens || aggregatedVault.tokens || []
      const withdrawTokens = aggregatedVault.withdrawTokens || aggregatedVault.tokens || []
      
      return {
        ...aggregatedVault,
        tokens: aggregatedVault.tokens?.map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          logoURI: token.logoUrl,
          decimals: token.decimals,
          isDepositAsset: depositTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase()),
          isWithdrawAsset: withdrawTokens.some(t => t.address.toLowerCase() === token.address.toLowerCase()),
        })) || [],
      }
    }

    // Fallback to direct API call
    const response = await fetch(`${STATS_API_BASE_URL}/strategies/${address}`)
    const data = await response.json()
    
    return {
      address: data.address || address,
      name: data.name,
      chainId: data.chainId || 8453,
      tvlUsd: data.tvlUsd || data.tvl,
      apy: data.apy || data.calculated_apy,
      tokens: data.tokens || [],
      description: data.description,
      pricePerShareUsd: data.pricePerShareUsd,
      performance24h: data.performance24h,
      performance7d: data.performance7d,
      performance30d: data.performance30d,
      performance90d: data.performance90d,
      vaultAnalytics: data.vaultAnalytics,
      protocols: data.protocols,
      depositStrategy: data.depositStrategy,
      balances: data.balances,
    }
  } catch (error) {
    console.error("Error fetching vault detail:", error)
    return null
  }
}

export function VaultDetail() {
  const { address } = useParams<{ address: string }>()
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit")
  const { chainId = 8453 } = useAccount()

  const { data: vault, isLoading } = useQuery({
    queryKey: ["vault", address],
    queryFn: () => fetchVaultDetail(address!),
    enabled: !!address,
  })

  // Enrich tokens with logos and symbols from FactorTokenlist
  const enrichedVault = useMemo(() => {
    if (!vault || !vault.tokens || vault.tokens.length === 0) return vault

    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      
      // Create whitelisted tokens map
      const whitelistedTokensMap = new Map<string, { symbol: string; name: string; logoUrl: string }>()
      BASE_WHITELISTED_TOKENS.forEach((baseToken) => {
        const tokenlistToken = allTokens.find((t: any) => 
          t.address?.toLowerCase() === baseToken.address.toLowerCase()
        )
        whitelistedTokensMap.set(baseToken.address.toLowerCase(), {
          symbol: tokenlistToken?.symbol || baseToken.symbol,
          name: tokenlistToken?.name || baseToken.name,
          logoUrl: tokenlistToken?.logoUrl || baseToken.logoURI || '',
        })
      })

      const enrichedTokens = vault.tokens.map((token) => {
        const addressLower = token.address?.toLowerCase()
        const whitelistedToken = whitelistedTokensMap.get(addressLower || '')
        
        // Try to get from FactorTokenlist first (most accurate source for decimals)
        const tokenlistToken = allTokens.find((t: any) => 
          t.address?.toLowerCase() === addressLower
        )
        
        // If token is whitelisted, use whitelisted data but keep decimals from tokenlist
        if (whitelistedToken) {
          return {
            ...token,
            symbol: whitelistedToken.symbol || token.symbol,
            name: whitelistedToken.name || token.name,
            logoURI: whitelistedToken.logoUrl || token.logoURI,
            // Use decimals from tokenlist if available, otherwise keep original
            decimals: tokenlistToken?.decimals ?? token.decimals ?? 18,
          }
        }
        
        if (tokenlistToken) {
          return {
            ...token,
            symbol: tokenlistToken.symbol || token.symbol,
            name: tokenlistToken.name || token.name,
            logoURI: tokenlistToken.logoUrl || token.logoURI,
            // Use decimals from tokenlist (most accurate source)
            decimals: tokenlistToken.decimals ?? token.decimals ?? 18,
          }
        }
        
        return token
      })

      return {
        ...vault,
        tokens: enrichedTokens,
      }
    } catch (error) {
      console.error('[VaultDetail] Error enriching tokens:', error)
      return vault
    }
  }, [vault, chainId])

  // Fetch user shares
  const { userShares, refetchShares } = useVaultUserShares({
    vaultAddress: enrichedVault?.address as Address,
    chainId: enrichedVault?.chainId,
    pricePerShareUsd: enrichedVault?.pricePerShareUsd,
  })

  // Merge user shares into vault data
  const vaultWithShares = enrichedVault
    ? {
        ...enrichedVault,
        userShares,
      }
    : null

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <Card variant="glass-apple">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!enrichedVault) {
    return (
      <div className="space-y-8">
        <Card variant="glass-apple" className="text-center p-8">
          <p className="text-muted-foreground">Vault not found</p>
          <Link to="/vaults">
            <Button variant="glass-apple" className="mt-4">
              Back to Vaults
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const depositTokens = enrichedVault.tokens?.filter((t) => t.isDepositAsset) || []
  const withdrawTokens = enrichedVault.tokens?.filter((t) => t.isWithdrawAsset) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        {/* Row 1: Back Button + Name */}
        <div className="flex items-center gap-4">
          <Link to="/vaults">
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
            {enrichedVault.name.replace(/^ethGlobal - wave: /i, "")}
          </h1>
        </div>
        
        {/* Row 2: Address + Rebalance Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {enrichedVault.address.slice(0, 6)}...{enrichedVault.address.slice(-4)}
          </p>
          <Button
            variant="glass-apple"
            className="rounded-full flex-shrink-0"
            onClick={() => {
              // TODO: Implement rebalance pairs price functionality
              console.log("Rebalance Pairs Price clicked")
            }}
          >
            Rebalance Pairs Price
          </Button>
        </div>
      </div>

      {/* Vault Info */}
      <Card variant="glass-apple">
        <CardHeader>
          <CardTitle>Vault Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">TVL</p>
              <p className="text-2xl font-bold">
                {enrichedVault.tvlUsd ? `$${parseFloat(enrichedVault.tvlUsd).toLocaleString(undefined, { 
                  maximumFractionDigits: 4,
                  minimumFractionDigits: 4
                })}` : "N/A"}
              </p>
            </div>
            {enrichedVault.pricePerShareUsd && (
              <div>
                <p className="text-sm text-muted-foreground">Share Price</p>
                <p className="text-2xl font-bold">
                  ${parseFloat(enrichedVault.pricePerShareUsd).toFixed(6)}
                </p>
              </div>
            )}
            {enrichedVault.performance7d && (
              <div>
                <p className="text-sm text-muted-foreground">7D Performance</p>
                <p className={`text-2xl font-bold ${
                  enrichedVault.performance7d.pnl?.startsWith('-') ? 'text-red-500' : 'text-green-500'
                }`}>
                  {enrichedVault.performance7d.pnl || '0%'}
                </p>
              </div>
            )}
          </div>

          {enrichedVault.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{enrichedVault.description}</p>
            </div>
          )}

          {enrichedVault.protocols && enrichedVault.protocols.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Protocols ({enrichedVault.protocols.length})</p>
              <div className="flex flex-wrap gap-2">
                {enrichedVault.protocols.map((protocol, idx) => (
                  <Badge key={idx} variant="secondary" className="glass">
                    {protocol}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {enrichedVault.tokens && enrichedVault.tokens.length > 0 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Supported Tokens ({enrichedVault.tokens.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {enrichedVault.tokens.map((token, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs hover:bg-accent/80 transition-colors"
                      title={token.name || token.symbol}
                    >
                      {token.logoURI ? (
                        <img
                          src={token.logoURI}
                          alt={token.symbol || 'Token'}
                          className="w-5 h-5 rounded-full flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {token.symbol?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="font-semibold">{token.symbol || 'Unknown'}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Aqua Pairs Section - From Subgraph */}
              {enrichedVault.aquaPairs && enrichedVault.aquaPairs.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aqua Pairs ({enrichedVault.aquaPairs.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {enrichedVault.aquaPairs.map((pair) => {
                      // Find token info from vault tokens
                      const token0 = enrichedVault.tokens?.find(
                        t => t.address.toLowerCase() === pair.token0.toLowerCase()
                      )
                      const token1 = enrichedVault.tokens?.find(
                        t => t.address.toLowerCase() === pair.token1.toLowerCase()
                      )
                      
                      return (
                        <Badge 
                          key={pair.id} 
                          variant="outline" 
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs hover:bg-accent/80 transition-colors"
                          title={`Pair Hash: ${pair.pairHash}\nFee: ${parseFloat(pair.feeBps) / 100}%\nTx: ${pair.txid}`}
                        >
                          {/* Token 0 */}
                          {token0?.logoURI ? (
                            <img
                              src={token0.logoURI}
                              alt={token0.symbol || 'Token 0'}
                              className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-muted-foreground">?</span>
                            </div>
                          )}
                          <span className="font-medium">{token0?.symbol || pair.token0.slice(0, 6)}</span>
                          <span className="text-muted-foreground">/</span>
                          {/* Token 1 */}
                          {token1?.logoURI ? (
                            <img
                              src={token1.logoURI}
                              alt={token1.symbol || 'Token 1'}
                              className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-muted-foreground">?</span>
                            </div>
                          )}
                          <span className="font-medium">{token1?.symbol || pair.token1.slice(0, 6)}</span>
                          {/* Fee display */}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({parseFloat(pair.feeBps) / 100}%)
                          </span>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fees Section - Compact */}
          {(enrichedVault.managementFee || enrichedVault.depositFee || enrichedVault.withdrawFee || enrichedVault.performanceFee) && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Fees</p>
              <div className="flex flex-wrap gap-2">
                {enrichedVault.managementFee && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Management:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.managementFee)}</span>
                  </div>
                )}
                {enrichedVault.depositFee && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.depositFee)}</span>
                  </div>
                )}
                {enrichedVault.withdrawFee && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Withdraw:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.withdrawFee)}</span>
                  </div>
                )}
                {enrichedVault.performanceFee && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Performance:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.performanceFee)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Actions */}
      <Card variant="glass-apple">
        <CardHeader>
          <CardTitle>Manage Position</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="glass mb-4">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              {vaultWithShares && (
                <VaultActions
                  vault={vaultWithShares}
                  mode="deposit"
                  availableTokens={depositTokens}
                  onBalanceUpdate={() => {
                    // Refresh shares balance after deposit
                    refetchShares()
                  }}
                />
              )}
            </TabsContent>
            <TabsContent value="withdraw">
              {vaultWithShares && (
                <VaultActions
                  vault={vaultWithShares}
                  mode="withdraw"
                  availableTokens={withdrawTokens}
                  onBalanceUpdate={() => {
                    // Refresh shares balance after withdraw
                    refetchShares()
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

