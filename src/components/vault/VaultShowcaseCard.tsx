import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { fetchVaultByAddress, AggregatedVault } from "@/services/vaultService"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BASE_WHITELISTED_TOKENS } from "@/lib/constants/baseTokens"
import { FactorTokenlist } from "@factordao/tokenlist"
import { useMemo } from "react"
import { useAccount } from "wagmi"

// Format performance percentage with icon
function formatPerformance(pnl?: string) {
  if (!pnl) return null
  
  const value = parseFloat(pnl.replace("%", ""))
  if (isNaN(value)) return null
  
  const isPositive = value > 0
  const isNegative = value < 0
  
  return {
    value: Math.abs(value).toFixed(2),
    isPositive,
    isNegative,
    icon: isPositive ? TrendingUp : isNegative ? TrendingDown : Minus,
    color: isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground",
  }
}

// Format fee from string
function formatFee(fee?: string): string {
  if (!fee || fee === "0") return "0%"
  
  const feeNum = parseFloat(fee)
  if (isNaN(feeNum)) return "N/A"
  
  if (feeNum > 1000000) {
    const percentage = (feeNum / 1e18) * 100
    return percentage < 0.01 ? "0%" : `${percentage.toFixed(2)}%`
  }
  
  if (feeNum <= 100) {
    return feeNum < 0.01 ? "0%" : `${feeNum.toFixed(2)}%`
  }
  
  return `${(feeNum / 100).toFixed(2)}%`
}

interface VaultShowcaseCardProps {
  vaultAddress: string
}

export function VaultShowcaseCard({ vaultAddress }: VaultShowcaseCardProps) {
  const { chainId = 8453 } = useAccount()

  const { data: vault, isLoading, error } = useQuery<AggregatedVault | null>({
    queryKey: ["vault", vaultAddress],
    queryFn: () => fetchVaultByAddress(vaultAddress),
    retry: 2,
  })

  // Get whitelisted tokens with logos from FactorTokenlist
  const whitelistedTokensMap = useMemo(() => {
    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      const map = new Map<string, { symbol: string; name: string; logoUrl: string; address: string }>()
      
      BASE_WHITELISTED_TOKENS.forEach((baseToken) => {
        const tokenlistToken = allTokens.find((t: any) => 
          t.address?.toLowerCase() === baseToken.address.toLowerCase()
        )
        
        map.set(baseToken.address.toLowerCase(), {
          symbol: tokenlistToken?.symbol || baseToken.symbol,
          name: tokenlistToken?.name || baseToken.name,
          logoUrl: tokenlistToken?.logoUrl || baseToken.logoURI || '',
          address: baseToken.address,
        })
      })
      
      return map
    } catch (error) {
      const map = new Map<string, { symbol: string; name: string; logoUrl: string; address: string }>()
      BASE_WHITELISTED_TOKENS.forEach((token) => {
        map.set(token.address.toLowerCase(), {
          symbol: token.symbol,
          name: token.name,
          logoUrl: token.logoURI || '',
          address: token.address,
        })
      })
      return map
    }
  }, [chainId])

  // Enrich vault tokens with logos from FactorTokenlist
  const enrichedVault = useMemo(() => {
    if (!vault) return null
    
    // Enrich all tokens with logos from whitelistedTokensMap or FactorTokenlist
    const enrichedTokens = vault.tokens?.map((token) => {
      const addressLower = token.address?.toLowerCase()
      const whitelistedToken = whitelistedTokensMap.get(addressLower)
      
      // If token is whitelisted, use whitelisted data (preferred)
      if (whitelistedToken) {
        return {
          ...token,
          symbol: whitelistedToken.symbol || token.symbol,
          name: whitelistedToken.name || token.name,
          logoUrl: whitelistedToken.logoUrl || token.logoUrl,
        }
      }
      
      // If not whitelisted but has logoUrl, keep it
      if (token.logoUrl) {
        return token
      }
      
      // Try to get from FactorTokenlist for non-whitelisted tokens
      try {
        const tokenlist = new FactorTokenlist(chainId as any)
        const allTokens = tokenlist.getAllGeneralTokens()
        const tokenlistToken = allTokens.find((t: any) => 
          t.address?.toLowerCase() === addressLower
        )
        
        if (tokenlistToken) {
          return {
            ...token,
            symbol: tokenlistToken.symbol || token.symbol,
            name: tokenlistToken.name || token.name,
            logoUrl: tokenlistToken.logoUrl || token.logoUrl,
          }
        }
      } catch (error) {
        // Silently fail
      }
      
      return token
    })
    
    return {
      ...vault,
      tokens: enrichedTokens,
    }
  }, [vault, whitelistedTokensMap, chainId])

  if (isLoading) {
    return (
      <Card variant="glass-apple" className="max-w-md mx-auto">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !enrichedVault) {
    return (
      <Card variant="glass-apple" className="max-w-md mx-auto text-center p-8">
        <p className="text-red-500 mb-2">Error loading vault</p>
        <p className="text-sm text-muted-foreground">
          Unable to fetch vault data
        </p>
      </Card>
    )
  }

  const displayName = enrichedVault.name.replace(/^ethGlobal - wave: /i, "")
  const perf24h = formatPerformance(enrichedVault.performance24h?.pnl)
  const perf7d = formatPerformance(enrichedVault.performance7d?.pnl)
  const perf30d = formatPerformance(enrichedVault.performance30d?.pnl)

  return (
    <Link to={`/vaults/${enrichedVault.address}`} className="block max-w-md mx-auto">
      <Card variant="glass-apple" className="glass-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full flex flex-col">
        <CardHeader className="pb-2 pt-4">
          {/* Header: Token Logos + Name */}
          <div className="flex items-start gap-2.5 mb-2">
            {/* Token Logos - Overlapping Stack */}
            {enrichedVault.tokens && enrichedVault.tokens.length > 0 ? (
              <div className="flex -space-x-2 flex-shrink-0">
                {enrichedVault.tokens.slice(0, 4).map((token, idx) => {
                  const hasLogo = !!token.logoUrl
                  return (
                    <div
                      key={`${token.address}-${idx}`}
                      className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 border-background flex items-center justify-center relative transition-all duration-300 hover:scale-150 hover:z-20 hover:shadow-xl group"
                      style={{ zIndex: enrichedVault.tokens!.length - idx }}
                      title={`${token.symbol || 'Unknown'} - ${token.name || 'Unknown Token'}`}
                    >
                      {hasLogo ? (
                        <img
                          src={token.logoUrl}
                          alt={token.symbol || 'Token'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('span.fallback')) {
                              const fallback = document.createElement('span')
                              fallback.className = 'fallback text-sm font-bold text-muted-foreground'
                              fallback.textContent = token.symbol?.charAt(0)?.toUpperCase() || '?'
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {token.symbol?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted border-2 border-background flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-muted-foreground">?</span>
              </div>
            )}
            
            {/* Name, Address, and Protocols */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-bold line-clamp-2 mb-0.5">
                {displayName}
              </CardTitle>
              <p className="text-[9px] text-muted-foreground mb-1.5">
                {enrichedVault.address.slice(0, 6)}...{enrichedVault.address.slice(-4)}
              </p>
              {enrichedVault.protocols && enrichedVault.protocols.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {enrichedVault.protocols.slice(0, 3).map((protocol, idx) => (
                    <Badge key={idx} variant="outline" className="text-[8px] px-1 py-0.5 h-3.5">
                      {protocol}
                    </Badge>
                  ))}
                  {enrichedVault.protocols.length > 3 && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0.5 h-3.5">
                      +{enrichedVault.protocols.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fees Section - Full Width Below */}
          {(enrichedVault.managementFee || enrichedVault.depositFee || enrichedVault.withdrawFee || enrichedVault.performanceFee) && (
            <div className="space-y-1 pt-2 border-t border-border/20">
              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Fees</p>
              <div className="flex flex-wrap gap-1">
                {enrichedVault.depositFee && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Dep:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.depositFee)}</span>
                  </div>
                )}
                {enrichedVault.withdrawFee && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Wth:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.withdrawFee)}</span>
                  </div>
                )}
                {enrichedVault.performanceFee && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Perf:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.performanceFee)}</span>
                  </div>
                )}
                {enrichedVault.managementFee && (
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                    <span className="text-muted-foreground">Mgmt:</span>
                    <span className="font-semibold">{formatFee(enrichedVault.managementFee)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-3 flex-1 flex flex-col px-3 pb-3">
          {/* TVL and Performance - Side by Side */}
          <div className="grid grid-cols-2 gap-2">
            {/* TVL - Left */}
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">TVL</p>
              <p className="text-lg font-bold">
                {enrichedVault.tvlUsd ? (
                  `$${parseFloat(enrichedVault.tvlUsd).toLocaleString(undefined, { 
                    maximumFractionDigits: 4,
                    minimumFractionDigits: 4
                  })}`
                ) : (
                  <span className="text-muted-foreground text-sm">N/A</span>
                )}
              </p>
            </div>
            
            {/* Performance Metrics - Right */}
            {(perf24h || perf7d || perf30d) && (
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Performance</p>
                <div className="flex gap-0.5 flex-nowrap overflow-hidden">
                  {perf24h && (() => {
                    const Icon = perf24h.icon
                    return (
                      <div className={`px-0.5 py-0.5 rounded-full border flex items-center gap-0.5 flex-shrink-0 ${
                        perf24h.isPositive 
                          ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                          : perf24h.isNegative
                          ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-muted-foreground/30 bg-muted/50 text-foreground"
                      }`}>
                        <Icon className={`w-1.5 h-1.5 ${perf24h.color}`} />
                        <span className={`text-[8px] font-bold ${perf24h.color}`}>
                          {perf24h.isPositive ? '+' : ''}{perf24h.value}%
                        </span>
                        <span className="text-[7px] opacity-75">24h</span>
                      </div>
                    )
                  })()}
                  {perf7d && (() => {
                    const Icon = perf7d.icon
                    return (
                      <div className={`px-0.5 py-0.5 rounded-full border flex items-center gap-0.5 flex-shrink-0 ${
                        perf7d.isPositive 
                          ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                          : perf7d.isNegative
                          ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-muted-foreground/30 bg-muted/50 text-foreground"
                      }`}>
                        <Icon className={`w-1.5 h-1.5 ${perf7d.color}`} />
                        <span className={`text-[8px] font-bold ${perf7d.color}`}>
                          {perf7d.isPositive ? '+' : ''}{perf7d.value}%
                        </span>
                        <span className="text-[7px] opacity-75">7d</span>
                      </div>
                    )
                  })()}
                  {perf30d && (() => {
                    const Icon = perf30d.icon
                    return (
                      <div className={`px-0.5 py-0.5 rounded-full border flex items-center gap-0.5 flex-shrink-0 ${
                        perf30d.isPositive 
                          ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                          : perf30d.isNegative
                          ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-muted-foreground/30 bg-muted/50 text-foreground"
                      }`}>
                        <Icon className={`w-1.5 h-1.5 ${perf30d.color}`} />
                        <span className={`text-[8px] font-bold ${perf30d.color}`}>
                          {perf30d.isPositive ? '+' : ''}{perf30d.value}%
                        </span>
                        <span className="text-[7px] opacity-75">30d</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {/* Token List - Compact with Logos */}
          {enrichedVault.tokens && enrichedVault.tokens.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Tokens</p>
              <div className="flex flex-wrap gap-1.5">
                {enrichedVault.tokens.map((token, idx) => (
                  <Badge 
                    key={`${token.address}-${idx}`} 
                    variant="secondary" 
                    className="flex items-center gap-1.5 px-2 py-0.5 text-xs hover:bg-accent/80 transition-colors"
                    title={token.name || token.symbol}
                  >
                    {token.logoUrl ? (
                      <img
                        src={token.logoUrl}
                        alt={token.symbol || 'Token'}
                        className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground">
                          {token.symbol?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-xs">{token.symbol || 'Unknown'}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Aqua Pairs Section */}
          {enrichedVault.aquaPairs && enrichedVault.aquaPairs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Aqua Pairs ({enrichedVault.aquaPairs.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {enrichedVault.aquaPairs.map((pair) => {
                  const token0 = whitelistedTokensMap.get(pair.token0.toLowerCase()) || 
                    enrichedVault.tokens?.find(t => t.address.toLowerCase() === pair.token0.toLowerCase())
                  const token1 = whitelistedTokensMap.get(pair.token1.toLowerCase()) || 
                    enrichedVault.tokens?.find(t => t.address.toLowerCase() === pair.token1.toLowerCase())
                  
                  return (
                    <Badge 
                      key={pair.id} 
                      variant="outline" 
                      className="flex items-center gap-1 px-1.5 py-0.5 text-xs hover:bg-accent/80 transition-colors"
                      title={`Fee: ${parseFloat(pair.feeBps) / 100}%`}
                    >
                      {token0?.logoUrl ? (
                        <img
                          src={token0.logoUrl}
                          alt={token0.symbol || 'Token 0'}
                          className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-bold text-muted-foreground">?</span>
                        </div>
                      )}
                      <span className="font-medium text-xs">{token0?.symbol || pair.token0.slice(0, 6)}</span>
                      <span className="text-muted-foreground text-[10px]">/</span>
                      {token1?.logoUrl ? (
                        <img
                          src={token1.logoUrl}
                          alt={token1.symbol || 'Token 1'}
                          className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] font-bold text-muted-foreground">?</span>
                        </div>
                      )}
                      <span className="font-medium text-xs">{token1?.symbol || pair.token1.slice(0, 6)}</span>
                      <span className="text-[8px] text-muted-foreground ml-0.5">
                        ({parseFloat(pair.feeBps) / 100}%)
                      </span>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 pb-3 px-4">
          <Button variant="glass-apple" className="w-full text-sm py-2.5">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

