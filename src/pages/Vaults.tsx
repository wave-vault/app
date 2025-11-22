import { useState, useMemo, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { fetchAggregatedVaults, AggregatedVault } from "@/services/vaultService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"

const VAULT_NAME_PREFIX = "ethGlobal - wave: "
import { TrendingUp, TrendingDown, Minus, Filter, X } from "lucide-react"
import { BASE_WHITELISTED_TOKENS, getBaseTokenByAddress } from "@/lib/constants/baseTokens"
import { FactorTokenlist } from "@factordao/tokenlist"

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

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

export function Vaults() {
  const [search, setSearch] = useState("")
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set())
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set())
  const [myBalance, setMyBalance] = useState(false)
  const { chainId = 8453, address, isConnected } = useAccount()

  const { data: vaults, isLoading, error } = useQuery<AggregatedVault[]>({
    queryKey: ["vaults"],
    queryFn: fetchAggregatedVaults,
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
          logoUrl: tokenlistToken?.logoUrl || tokenlistToken?.logoURI || baseToken.logoURI || '',
          address: baseToken.address,
        })
      })
      
      return map
    } catch (error) {
      console.error('[Vaults] Error loading tokenlist:', error)
      // Fallback to base tokens only
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

  // Enrich vault tokens with logos from FactorTokenlist (show all tokens, but prioritize whitelisted)
  const enrichedVaults = useMemo(() => {
    if (!vaults) return []
    
    return vaults.map((vault) => {
      if (!vault.tokens || vault.tokens.length === 0) {
        return vault
      }
      
      // Enrich all tokens with logos from whitelistedTokensMap or FactorTokenlist
      const enrichedTokens = vault.tokens.map((token) => {
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
              logoUrl: tokenlistToken.logoUrl || tokenlistToken.logoURI || token.logoUrl,
            }
          }
        } catch (error) {
          // Silently fail
        }
        
        return token
      })
      
      // Filter to show only whitelisted tokens (but keep all for fallback)
      const whitelistedOnly = enrichedTokens.filter((token) => {
        const addressLower = token.address?.toLowerCase()
        return whitelistedTokensMap.has(addressLower)
      })
      
      return {
        ...vault,
        tokens: whitelistedOnly.length > 0 ? whitelistedOnly : enrichedTokens,
      }
    })
  }, [vaults, whitelistedTokensMap, chainId])

  // Extract all unique tokens and pairs from vaults
  const availableTokens = useMemo(() => {
    if (!enrichedVaults) return []
    const tokenMap = new Map<string, { symbol: string; logoUrl?: string; address: string }>()
    
    enrichedVaults.forEach((vault) => {
      vault.tokens?.forEach((token) => {
        const addr = token.address.toLowerCase()
        if (!tokenMap.has(addr)) {
          tokenMap.set(addr, {
            symbol: token.symbol || 'Unknown',
            logoUrl: token.logoUrl,
            address: token.address,
          })
        }
      })
    })
    
    return Array.from(tokenMap.values()).sort((a, b) => a.symbol.localeCompare(b.symbol))
  }, [enrichedVaults])

  // Extract all unique pairs from vaults with token info
  const availablePairs = useMemo(() => {
    if (!enrichedVaults) return []
    const pairMap = new Map<string, { tokenA: { symbol: string; logoUrl?: string; address: string }, tokenB: { symbol: string; logoUrl?: string; address: string } }>()
    
    enrichedVaults.forEach((vault) => {
      if (vault.tokens && vault.tokens.length >= 2) {
        vault.tokens.forEach((tokenA, idxA) => {
          vault.tokens!.slice(idxA + 1).forEach((tokenB) => {
            const addrA = tokenA.address.toLowerCase()
            const addrB = tokenB.address.toLowerCase()
            const pairKey = [addrA, addrB].sort().join('-')
            
            if (!pairMap.has(pairKey)) {
              pairMap.set(pairKey, {
                tokenA: {
                  symbol: tokenA.symbol || 'Unknown',
                  logoUrl: tokenA.logoUrl,
                  address: tokenA.address,
                },
                tokenB: {
                  symbol: tokenB.symbol || 'Unknown',
                  logoUrl: tokenB.logoUrl,
                  address: tokenB.address,
                },
              })
            }
          })
        })
      }
    })
    
    return Array.from(pairMap.entries()).map(([key, value]) => ({
      key,
      ...value,
    })).sort((a, b) => {
      const pairA = `${a.tokenA.symbol}/${a.tokenB.symbol}`
      const pairB = `${b.tokenA.symbol}/${b.tokenB.symbol}`
      return pairA.localeCompare(pairB)
    })
  }, [enrichedVaults])

  // Track token balances for "On My Wallet" filter
  const [tokenBalances, setTokenBalances] = useState<Map<string, bigint>>(new Map())
  
  // Component to read balance for a single token
  function TokenBalanceReader({ tokenAddress }: { tokenAddress: string }) {
    const { data: balance } = useReadContract({
      address: tokenAddress as `0x${string}` | undefined,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!tokenAddress && !!address && isConnected,
      },
    })

    useEffect(() => {
      if (balance !== undefined) {
        setTokenBalances((prev) => {
          const newMap = new Map(prev)
          newMap.set(tokenAddress.toLowerCase(), balance as bigint)
          return newMap
        })
      }
    }, [balance, tokenAddress])

    return null
  }


  const filteredVaults = useMemo(() => {
    if (!enrichedVaults) return []
    
    let filtered = enrichedVaults
    
    // Filter by search
    if (search) {
      filtered = filtered.filter((vault) =>
      vault.name.toLowerCase().includes(search.toLowerCase())
    )
    }
    
    // Filter by selected tokens
    if (selectedTokens.size > 0) {
      filtered = filtered.filter((vault) => {
        if (!vault.tokens || vault.tokens.length === 0) return false
        return vault.tokens.some((token) =>
          selectedTokens.has(token.address.toLowerCase())
        )
      })
    }
    
    // Filter by selected pairs
    if (selectedPairs.size > 0) {
      filtered = filtered.filter((vault) => {
        if (!vault.tokens || vault.tokens.length < 2) return false
        
        // Check if vault contains any of the selected pairs
        return Array.from(selectedPairs).some((pairKey) => {
          const [addrA, addrB] = pairKey.split('-')
          return vault.tokens!.some((token) => {
            const tokenAddr = token.address.toLowerCase()
            if (tokenAddr === addrA || tokenAddr === addrB) {
              // Check if the other token of the pair is also in the vault
              return vault.tokens!.some((otherToken) => {
                const otherAddr = otherToken.address.toLowerCase()
                return (tokenAddr === addrA && otherAddr === addrB) || 
                       (tokenAddr === addrB && otherAddr === addrA)
              })
            }
            return false
          })
        })
      })
    }
    
    // Filter by "My Balance" - show only vaults where user has balance > 0 for at least one token
    if (myBalance && isConnected) {
      filtered = filtered.filter((vault) => {
        if (!vault.tokens || vault.tokens.length === 0) return false
        return vault.tokens.some((token) => {
          const balance = tokenBalances.get(token.address.toLowerCase())
          return balance !== undefined && balance > 0n
        })
      })
    }
    
    return filtered
  }, [enrichedVaults, search, selectedTokens, selectedPairs, myBalance, isConnected, tokenBalances])

  const toggleTokenFilter = (tokenAddress: string) => {
    const addr = tokenAddress.toLowerCase()
    setSelectedTokens((prev) => {
      const next = new Set(prev)
      if (next.has(addr)) {
        next.delete(addr)
      } else {
        next.add(addr)
      }
      return next
    })
  }

  const togglePairFilter = (pairKey: string) => {
    setSelectedPairs((prev) => {
      const next = new Set(prev)
      if (next.has(pairKey)) {
        next.delete(pairKey)
      } else {
        next.add(pairKey)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSelectedTokens(new Set())
    setSelectedPairs(new Set())
    setMyBalance(false)
    setSearch("")
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Add Liquidity</h1>
        <p className="text-muted-foreground">
          Browse and deposit into available vaults
        </p>
      </div>

      {/* Search and Filter */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1">
        <Input
          variant="glass"
          placeholder="Search vaults..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
          </div>
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass-apple" className="rounded-full flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
                {(selectedTokens.size > 0 || selectedPairs.size > 0 || myBalance) && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {selectedTokens.size + selectedPairs.size + (myBalance ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[600px] overflow-y-auto p-0">
              {/* Checkbox for My Balance filter */}
              <div className="p-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="myBalance"
                    checked={myBalance}
                    onCheckedChange={(checked) => setMyBalance(checked === true)}
                    disabled={!isConnected}
                  />
                  <label
                    htmlFor="myBalance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    My Balance
                  </label>
                </div>
              </div>

              {/* Tabs for Token and Pairs */}
              <Tabs defaultValue="tokens" className="w-full">
                <TabsList className="w-full rounded-none border-b border-border">
                  <TabsTrigger value="tokens" className="flex-1">
                    Tokens
                    {selectedTokens.size > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                        {selectedTokens.size}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pairs" className="flex-1">
                    Pairs
                    {selectedPairs.size > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                        {selectedPairs.size}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="tokens" className="p-0 m-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {availableTokens.length > 0 ? (
                      <>
                        {availableTokens.map((token) => {
                          const isSelected = selectedTokens.has(token.address.toLowerCase())
                          return (
                            <div key={token.address}>
                              {isConnected && (
                                <TokenBalanceReader tokenAddress={token.address} />
                              )}
                              <DropdownMenuCheckboxItem
                                checked={isSelected}
                                onCheckedChange={() => toggleTokenFilter(token.address)}
                                className="flex items-center gap-2"
                              >
                                {token.logoUrl ? (
                                  <img
                                    src={token.logoUrl}
                                    alt={token.symbol}
                                    className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                    <span className="text-[8px] font-bold text-muted-foreground">
                                      {token.symbol.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                  </div>
                                )}
                                <span className="font-medium">{token.symbol}</span>
                              </DropdownMenuCheckboxItem>
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No tokens available
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pairs" className="p-0 m-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {availablePairs.length > 0 ? (
                      <>
                        {availablePairs.map((pair) => {
                          const isSelected = selectedPairs.has(pair.key)
                          return (
                            <div key={pair.key}>
                              {isConnected && (
                                <>
                                  <TokenBalanceReader tokenAddress={pair.tokenA.address} />
                                  <TokenBalanceReader tokenAddress={pair.tokenB.address} />
                                </>
                              )}
                              <DropdownMenuCheckboxItem
                                checked={isSelected}
                                onCheckedChange={() => togglePairFilter(pair.key)}
                                className="flex items-center gap-2"
                              >
                                <div className="flex items-center gap-1.5">
                                  {/* Token A */}
                                  {pair.tokenA.logoUrl ? (
                                    <img
                                      src={pair.tokenA.logoUrl}
                                      alt={pair.tokenA.symbol}
                                      className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-[8px] font-bold text-muted-foreground">
                                        {pair.tokenA.symbol.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="font-medium text-xs">{pair.tokenA.symbol}</span>
                                  <span className="text-muted-foreground text-[10px]">/</span>
                                  {/* Token B */}
                                  {pair.tokenB.logoUrl ? (
                                    <img
                                      src={pair.tokenB.logoUrl}
                                      alt={pair.tokenB.symbol}
                                      className="w-4 h-4 rounded-full flex-shrink-0 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-[8px] font-bold text-muted-foreground">
                                        {pair.tokenB.symbol.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="font-medium text-xs">{pair.tokenB.symbol}</span>
                                </div>
                              </DropdownMenuCheckboxItem>
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No pairs available
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Active Filters Display */}
        {(selectedTokens.size > 0 || selectedPairs.size > 0 || myBalance || search) && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {/* Clear All Button */}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-6 px-2 text-xs"
              onClick={clearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
            {/* My Balance Filter */}
            {myBalance && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1.5 px-2 py-1 text-xs"
              >
                <span>My Balance</span>
                <button
                  onClick={() => setMyBalance(false)}
                  className="ml-1 hover:bg-accent rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {/* Token Filters */}
            {Array.from(selectedTokens).map((tokenAddr) => {
              const token = availableTokens.find(
                (t) => t.address.toLowerCase() === tokenAddr
              )
              if (!token) return null
              return (
                <Badge
                  key={`token-${tokenAddr}`}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs"
                >
                  {token.logoUrl && (
                    <img
                      src={token.logoUrl}
                      alt={token.symbol}
                      className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span>{token.symbol}</span>
                  <button
                    onClick={() => toggleTokenFilter(token.address)}
                    className="ml-1 hover:bg-accent rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}
            {/* Pair Filters */}
            {Array.from(selectedPairs).map((pairKey) => {
              const pair = availablePairs.find((p) => p.key === pairKey)
              if (!pair) return null
              return (
                <Badge
                  key={`pair-${pairKey}`}
                  variant="outline"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs"
                >
                  {pair.tokenA.logoUrl && (
                    <img
                      src={pair.tokenA.logoUrl}
                      alt={pair.tokenA.symbol}
                      className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span>{pair.tokenA.symbol}</span>
                  <span className="text-muted-foreground text-[10px]">/</span>
                  {pair.tokenB.logoUrl && (
                    <img
                      src={pair.tokenB.logoUrl}
                      alt={pair.tokenB.symbol}
                      className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span>{pair.tokenB.symbol}</span>
                  <button
                    onClick={() => togglePairFilter(pairKey)}
                    className="ml-1 hover:bg-accent rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Vaults Grid */}
      {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 max-w-[1800px] mx-auto">
          {[...Array(6)].map((_, i) => (
            <Card key={i} variant="glass-apple">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
          ) : error ? (
            <Card variant="glass-apple" className="text-center p-8">
              <p className="text-red-500 mb-2">Error loading vaults</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Failed to fetch vault data"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Please check your network connection and try again.
              </p>
            </Card>
      ) : filteredVaults.length === 0 ? (
        <Card variant="glass-apple" className="text-center p-8">
          <p className="text-muted-foreground">
            {search ? "No vaults found matching your search" : "No vaults available"}
          </p>
              {!search && vaults && vaults.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No vaults found with prefix "{VAULT_NAME_PREFIX}"
                </p>
              )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 max-w-[1800px] mx-auto">
          {filteredVaults.map((vault) => {
            const displayName = vault.name.replace(/^ethGlobal - wave: /i, "")
            const perf24h = formatPerformance(vault.performance24h?.pnl)
            const perf7d = formatPerformance(vault.performance7d?.pnl)
            const perf30d = formatPerformance(vault.performance30d?.pnl)
            
            return (
            <Link key={vault.address} to={`/vaults/${vault.address}`}>
                <Card variant="glass-apple" className="glass-hover transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full flex flex-col">
                  <CardHeader className="pb-2 pt-4">
                    {/* Header: Token Logos + Name */}
                    <div className="flex items-start gap-2.5 mb-2">
                      {/* Token Logos - Overlapping Stack */}
                      {vault.tokens && vault.tokens.length > 0 ? (
                        <div className="flex -space-x-2 flex-shrink-0">
                          {vault.tokens.slice(0, 4).map((token, idx) => {
                            const hasLogo = !!token.logoUrl
                            return (
                              <div
                                key={`${token.address}-${idx}`}
                                className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 border-background flex items-center justify-center relative transition-all duration-300 hover:scale-150 hover:z-20 hover:shadow-xl group"
                                style={{ zIndex: vault.tokens!.length - idx }}
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
                      
                      {/* Name, Address, Protocols, and Fees */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-bold line-clamp-2 mb-0.5">
                          {displayName}
                        </CardTitle>
                        <p className="text-[9px] text-muted-foreground mb-1.5">
                          {vault.address.slice(0, 6)}...{vault.address.slice(-4)}
                        </p>
                        {vault.protocols && vault.protocols.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {vault.protocols.slice(0, 3).map((protocol, idx) => (
                              <Badge key={idx} variant="outline" className="text-[8px] px-1 py-0.5 h-3.5">
                                {protocol}
                              </Badge>
                            ))}
                            {vault.protocols.length > 3 && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0.5 h-3.5">
                                +{vault.protocols.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        {/* Fees Section - Under Name and Address */}
                        {(vault.managementFee || vault.depositFee || vault.withdrawFee || vault.performanceFee) && (
                          <div className="space-y-1">
                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Fees</p>
                            <div className="flex flex-wrap gap-1">
                              {vault.managementFee && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                                  <span className="text-muted-foreground">Mgmt:</span>
                                  <span className="font-semibold">{formatFee(vault.managementFee)}</span>
                                </div>
                              )}
                              {vault.depositFee && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                                  <span className="text-muted-foreground">Dep:</span>
                                  <span className="font-semibold">{formatFee(vault.depositFee)}</span>
                                </div>
                              )}
                              {vault.withdrawFee && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                                  <span className="text-muted-foreground">Wth:</span>
                                  <span className="font-semibold">{formatFee(vault.withdrawFee)}</span>
                                </div>
                              )}
                              {vault.performanceFee && (
                                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-muted/50 border border-border/30">
                                  <span className="text-muted-foreground">Perf:</span>
                                  <span className="font-semibold">{formatFee(vault.performanceFee)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                </CardHeader>
                  
                  <CardContent className="space-y-3 flex-1 flex flex-col px-4 pb-3">
                    {/* TVL and Performance - Side by Side */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* TVL - Left */}
                    <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">TVL</p>
                        <p className="text-lg font-bold">
                          {vault.tvlUsd ? (
                            `$${parseFloat(vault.tvlUsd).toLocaleString(undefined, { 
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 0
                            })}`
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </p>
                      </div>
                      
                      {/* Performance Metrics - Right */}
                      {(perf24h || perf7d || perf30d) && (
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Performance</p>
                          <div className="flex flex-wrap gap-1">
                            {perf24h && (() => {
                              const Icon = perf24h.icon
                              return (
                                <div className={`px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                                  perf24h.isPositive 
                                    ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                                    : perf24h.isNegative
                                    ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "border-muted-foreground/30 bg-muted/50 text-foreground"
                                }`}>
                                  <Icon className={`w-2.5 h-2.5 ${perf24h.color}`} />
                                  <span className={`text-[10px] font-bold ${perf24h.color}`}>
                                    {perf24h.isPositive ? '+' : ''}{perf24h.value}%
                                  </span>
                                  <span className="text-[8px] opacity-75">24h</span>
                                </div>
                              )
                            })()}
                            {perf7d && (() => {
                              const Icon = perf7d.icon
                              return (
                                <div className={`px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                                  perf7d.isPositive 
                                    ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                                    : perf7d.isNegative
                                    ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "border-muted-foreground/30 bg-muted/50 text-foreground"
                                }`}>
                                  <Icon className={`w-2.5 h-2.5 ${perf7d.color}`} />
                                  <span className={`text-[10px] font-bold ${perf7d.color}`}>
                                    {perf7d.isPositive ? '+' : ''}{perf7d.value}%
                                  </span>
                                  <span className="text-[8px] opacity-75">7d</span>
                                </div>
                              )
                            })()}
                            {perf30d && (() => {
                              const Icon = perf30d.icon
                              return (
                                <div className={`px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${
                                  perf30d.isPositive 
                                    ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" 
                                    : perf30d.isNegative
                                    ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "border-muted-foreground/30 bg-muted/50 text-foreground"
                                }`}>
                                  <Icon className={`w-2.5 h-2.5 ${perf30d.color}`} />
                                  <span className={`text-[10px] font-bold ${perf30d.color}`}>
                                    {perf30d.isPositive ? '+' : ''}{perf30d.value}%
                                  </span>
                                  <span className="text-[8px] opacity-75">30d</span>
                                </div>
                              )
                            })()}
                          </div>
                      </div>
                    )}
                    </div>
                    
                    {/* Token List - Compact with Logos */}
                    {vault.tokens && vault.tokens.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Tokens</p>
                        <div className="flex flex-wrap gap-1.5">
                          {vault.tokens.map((token, idx) => (
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

                    {/* Pairs Section */}
                    {vault.tokens && vault.tokens.length >= 2 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                          Pairs ({Math.floor((vault.tokens.length * (vault.tokens.length - 1)) / 2)})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {vault.tokens.map((tokenA, idxA) => 
                            vault.tokens!.slice(idxA + 1).map((tokenB) => {
                              const pairId = `${tokenA.address}-${tokenB.address}`
                              return (
                                <Badge 
                                  key={pairId} 
                                  variant="outline" 
                                  className="flex items-center gap-1 px-1.5 py-0.5 text-xs hover:bg-accent/80 transition-colors"
                                >
                                  {/* Token A */}
                                  {tokenA.logoUrl ? (
                                    <img
                                      src={tokenA.logoUrl}
                                      alt={tokenA.symbol || 'Token A'}
                                      className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-[7px] font-bold text-muted-foreground">
                                        {tokenA.symbol?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="font-medium text-xs">{tokenA.symbol || 'Unknown'}</span>
                                  <span className="text-muted-foreground text-[10px]">/</span>
                                  {/* Token B */}
                                  {tokenB.logoUrl ? (
                                    <img
                                      src={tokenB.logoUrl}
                                      alt={tokenB.symbol || 'Token B'}
                                      className="w-3 h-3 rounded-full flex-shrink-0 object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-[7px] font-bold text-muted-foreground">
                                        {tokenB.symbol?.charAt(0)?.toUpperCase() || '?'}
                                      </span>
                                    </div>
                                  )}
                                  <span className="font-medium text-xs">{tokenB.symbol || 'Unknown'}</span>
                                </Badge>
                              )
                            })
                          )}
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
          })}
        </div>
      )}
    </div>
  )
}

