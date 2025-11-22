import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn, formatAddress } from "@/lib/utils"
import { FactorTokenlist } from "@factordao/tokenlist"
import { useAccount, useReadContract } from "wagmi"
import { ChevronDown, ExternalLink, Copy, Check } from "lucide-react"
import { BASE_WHITELISTED_TOKENS, getBaseTokenByAddress } from "@/lib/constants/baseTokens"
import { formatUnits } from "viem"

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

interface TokenSelectorProps {
  value: string | null
  onChange: (value: string | null) => void
  className?: string
  showBalance?: boolean
  title?: string
  // For multi-select mode (vault creation)
  selected?: string[]
  onMultiChange?: (tokens: string[]) => void
}

interface TokenRowProps {
  token: any
  address: string | undefined
  isConnected: boolean
  onSelect: () => void
  onCopyAddress: (address: string, e: React.MouseEvent) => void
  copiedAddress: string | null
  explorerUrl: string
  balance?: bigint | null
  isLoadingBalance?: boolean
  isSelected?: boolean
}

function TokenRow({ token, address, isConnected, onSelect, onCopyAddress, copiedAddress, explorerUrl, balance: balanceProp, isLoadingBalance: isLoadingBalanceProp, showBalance = true, isSelected = false }: TokenRowProps & { showBalance?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  // Read token balance if not provided as prop
  const { data: balanceData, isLoading: isLoadingBalanceData } = useReadContract({
    address: token.address as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!token.address && !!address && isConnected && balanceProp === undefined && showBalance,
    },
  })

  const balance = balanceProp !== undefined ? balanceProp : balanceData
  const isLoadingBalance = isLoadingBalanceProp !== undefined ? isLoadingBalanceProp : isLoadingBalanceData

  const formattedBalance = useMemo(() => {
    if (!balance || !token.decimals) return "0"
    const balanceValue = parseFloat(formatUnits(balance as bigint, token.decimals))
    if (balanceValue === 0) return "0"
    if (balanceValue < 0.000001) return "<0.000001"
    return balanceValue.toLocaleString(undefined, {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    })
  }, [balance, token.decimals])

  // UI for vault creation - IDENTICAL layout to swap mode, but with checkbox instead of balance
  if (!showBalance) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
        onClick={onSelect}
      >
        {/* Left: Logo, Symbol, Name - IDENTICAL to swap mode */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {token.logoUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={token.logoUrl}
                alt={token.symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">
                {token.symbol?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <span className="font-medium text-sm truncate">{token.symbol}</span>
            <span className="text-xs text-muted-foreground truncate">
              {token.name}
            </span>
          </div>
        </div>

        {/* Right: Checkbox instead of balance */}
        <div className="text-right flex-shrink-0">
          {isSelected ? (
            <div className="w-4 h-4 rounded-full bg-aqua-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>
      </div>
    )
  }

  // Full UI for swap (with balance and address)
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left: Logo, Symbol, Name/Address, Copy and Explorer */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {token.logoUrl ? (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
            <img
              src={token.logoUrl}
              alt={token.symbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">
              {token.symbol?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="font-medium text-sm truncate">{token.symbol}</span>
          {/* Show name by default, address with icons on hover */}
          {isHovered ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => onCopyAddress(token.address, e)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
                title="Copy address"
              >
                {copiedAddress === token.address ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <span className="text-xs text-muted-foreground truncate">
                {formatAddress(token.address)}
              </span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground truncate">
              {token.name}
            </span>
          )}
        </div>
      </div>

      {/* Right: Balance only */}
      {isConnected && (
        <div className="text-right flex-shrink-0">
          {isLoadingBalance ? (
            <span className="text-xs text-muted-foreground">...</span>
          ) : (
            <span className="text-xs font-medium text-foreground">
              {formattedBalance}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

type TokenFilter = "all" | "stable" | "eth" | "btc"

export function TokenSelector({ value, onChange, className, showBalance = true, title = "Select Token", selected, onMultiChange }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<TokenFilter>("all")
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const { chainId = 8453, address, isConnected } = useAccount() // Default to BASE
  
  // Multi-select mode
  const isMultiSelect = !showBalance && selected !== undefined && onMultiChange !== undefined

  // Get whitelisted addresses (filter out placeholders)
  const validWhitelistedTokens = BASE_WHITELISTED_TOKENS.filter((token) => {
    const isPlaceholder = 
      token.address === "0x0000000000000000000000000000000000000000" ||
      token.address.startsWith("0xcbB7C000") ||
      token.address.length !== 42
    return !isPlaceholder
  })

  // Get tokens from FactorTokenlist - fetch all tokens that match baseTokens addresses
  const availableTokens = useMemo(() => {
    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      
      // Create a map of baseToken addresses for quick lookup
      const baseTokenAddressMap = new Map(
        validWhitelistedTokens.map(token => [token.address.toLowerCase(), token])
      )
      
      // Find all tokens from tokenlist that match baseTokens addresses
      const foundTokens = allTokens
        .filter((token: any) => {
          const tokenAddress = token.address?.toLowerCase()
          // Check if this token address is in our baseTokens list
          return baseTokenAddressMap.has(tokenAddress)
        })
        .map((token: any) => {
          const baseToken = baseTokenAddressMap.get(token.address?.toLowerCase())
          
          // Use tokenlist data as primary source, fallback to baseToken if needed
          return {
            symbol: token.symbol || baseToken?.symbol || '',
            name: token.name || baseToken?.name || '',
            address: token.address?.toLowerCase() || '',
            decimals: token.decimals ?? baseToken?.decimals ?? 18,
            logoUrl: token.logoUrl || token.logoURI || baseToken?.logoURI || '',
            logoURI: token.logoUrl || token.logoURI || baseToken?.logoURI || '',
          }
        })
      
      // Also include baseTokens that might not be in tokenlist yet
      const baseTokensNotInList = validWhitelistedTokens
        .filter(baseToken => {
          const baseAddress = baseToken.address.toLowerCase()
          // Check if this baseToken is already in foundTokens
          return !foundTokens.some((t: any) => t.address === baseAddress)
        })
        .map(baseToken => ({
          symbol: baseToken.symbol,
          name: baseToken.name,
          address: baseToken.address.toLowerCase(),
          decimals: baseToken.decimals,
          logoUrl: baseToken.logoURI || '',
          logoURI: baseToken.logoURI || '',
        }))
      
      // Combine found tokens from tokenlist with baseTokens not in list
      const allAvailableTokens = [...foundTokens, ...baseTokensNotInList]
      
      // Sort by symbol for better UX
      return allAvailableTokens.sort((a, b) => 
        a.symbol.localeCompare(b.symbol)
      )
    } catch (error) {
      console.error('[TokenSelector] Error loading tokens:', error)
      // Fallback to whitelist only if tokenlist fails
      return validWhitelistedTokens
        .filter(token => {
          // Filter out placeholders
          return token.address !== "0x0000000000000000000000000000000000000000" &&
                 !token.address.startsWith("0xcbB7C000") &&
                 token.address.length === 42
        })
        .map((token) => ({
        symbol: token.symbol,
        name: token.name,
        address: token.address.toLowerCase(),
        decimals: token.decimals,
        logoUrl: token.logoURI || '',
        logoURI: token.logoURI || '',
      }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
    }
  }, [chainId])

  // Define token categories
  const stableCoins = ["USDC", "USDT", "USDbC", "EURC", "USDe", "GHO"]
  const ethTokens = ["wETH", "cbETH", "wstETH", "weETH", "renzo", "rsETHWrapper", "ezETH"]
  const btcTokens = ["wBTC", "cbBTC", "lBTC", "WBTCB"]

  const filteredTokens = availableTokens.filter((token: any) => {
    // Search filter
    const matchesSearch =
    token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      token.name?.toLowerCase().includes(search.toLowerCase()) ||
      token.address?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    // Category filter
    if (filter === "all") return true
    
    const symbol = token.symbol?.toUpperCase()
    if (filter === "stable") {
      return stableCoins.some((coin) => coin.toUpperCase() === symbol)
    }
    if (filter === "eth") {
      return ethTokens.some((eth) => eth.toUpperCase() === symbol)
    }
    if (filter === "btc") {
      return btcTokens.some((btc) => btc.toUpperCase() === symbol)
    }
    
    return true
  })

  // Component that reads balance for a single token and reports it back
  function TokenWithBalance({ 
    token, 
    onBalanceUpdate 
  }: { 
    token: any
    onBalanceUpdate: (address: string, balance: bigint | null, isLoading: boolean) => void 
  }) {
    const { data: balance, isLoading } = useReadContract({
      address: token.address as `0x${string}` | undefined,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: address ? [address as `0x${string}`] : undefined,
      query: {
        enabled: !!token.address && !!address && isConnected,
      },
    })

    useEffect(() => {
      onBalanceUpdate(token.address, balance as bigint | null, isLoading)
    }, [token.address, balance, isLoading, onBalanceUpdate])

    return null
  }

  // State to track balances for sorting
  const [tokenBalances, setTokenBalances] = useState<Map<string, { balance: bigint | null; isLoading: boolean }>>(new Map())

  const handleBalanceUpdate = (tokenAddress: string, balance: bigint | null, isLoading: boolean) => {
    setTokenBalances(prev => {
      const newMap = new Map(prev)
      newMap.set(tokenAddress, { balance, isLoading })
      return newMap
    })
  }

  // Sort filtered tokens by balance (only if showBalance is true)
  const sortedFilteredTokens = useMemo(() => {
    if (!showBalance || !isConnected) {
      // Sort alphabetically if balance is not shown
      return [...filteredTokens].sort((a, b) => 
        a.symbol.localeCompare(b.symbol)
      )
    }

    const tokensWithBalances = filteredTokens.map(token => {
      const balanceInfo = tokenBalances.get(token.address)
      return {
        token,
        balance: balanceInfo?.balance || null,
        isLoading: balanceInfo?.isLoading || false,
      }
    })

    // Sort by balance (highest first), then by symbol for tokens with same balance
    return tokensWithBalances.sort((a, b) => {
      const balanceA = a.balance ? parseFloat(formatUnits(a.balance, a.token.decimals || 18)) : 0
      const balanceB = b.balance ? parseFloat(formatUnits(b.balance, b.token.decimals || 18)) : 0
      
      if (balanceB !== balanceA) {
        return balanceB - balanceA // Higher balance first
      }
      // If balances are equal, sort by symbol
      return a.token.symbol.localeCompare(b.token.symbol)
    }).map(item => item.token)
  }, [filteredTokens, tokenBalances, isConnected, showBalance])

  const selectedToken = useMemo(() => {
    if (!value) return null
    // Try to find in available tokens first
    const found = availableTokens.find((token: any) => 
      token.address?.toLowerCase() === value.toLowerCase()
    )
    if (found) return found
    
    // Fallback: try to get from base tokens
    const baseToken = getBaseTokenByAddress(value)
    if (baseToken) {
      return {
        symbol: baseToken.symbol,
        name: baseToken.name,
        address: baseToken.address.toLowerCase(),
        decimals: baseToken.decimals,
        logoUrl: baseToken.logoURI || '',
        logoURI: baseToken.logoURI || '',
      }
    }
    return null
  }, [value, availableTokens])

  const handleCopyAddress = async (address: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const getExplorerUrl = (address: string) => {
    if (chainId === 8453) {
      return `https://basescan.org/address/${address}`
    }
    return `https://etherscan.io/address/${address}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isMultiSelect ? "glass" : "outline"}
          className={cn(
            isMultiSelect 
              ? "w-full justify-between"
              : "h-auto py-3 px-5 rounded-full border-2 border-border bg-background hover:bg-accent justify-between gap-2 min-w-[140px] transition-all duration-300 hover:scale-105 hover:shadow-lg",
            className
          )}
        >
          {isMultiSelect ? (
            <>
              <span>Select tokens ({selected?.length || 0} selected)</span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </>
          ) : (
            <>
          {selectedToken ? (
            <div className="flex items-center gap-2">
              {selectedToken.logoUrl && (
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={selectedToken.logoUrl}
                    alt={selectedToken.symbol}
                    className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none'
                        }}
                  />
                </div>
              )}
              <span className="font-medium">{selectedToken.symbol}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select token</span>
          )}
              <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent variant="glass-apple" className="max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-0.5">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-5 px-2 text-[10px] rounded-full min-w-[32px]"
              >
                All
              </Button>
              <Button
                variant={filter === "stable" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("stable")}
                className="h-5 px-2 text-[10px] rounded-full min-w-[32px]"
              >
                Stable
              </Button>
              <Button
                variant={filter === "eth" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("eth")}
                className="h-5 px-2 text-[10px] rounded-full min-w-[32px]"
              >
                ETH
              </Button>
              <Button
                variant={filter === "btc" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("btc")}
                className="h-5 px-2 text-[10px] rounded-full min-w-[32px]"
              >
                BTC
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            variant="glass"
            placeholder="Search token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tokens found
              </div>
            ) : (
              <>
                {/* Hidden components to read balances (only if showBalance is true) */}
                {showBalance && filteredTokens.map((token: any) => (
                  <TokenWithBalance
                    key={`balance-${token.address}`}
                    token={token}
                    onBalanceUpdate={handleBalanceUpdate}
                  />
                ))}
                {/* Render sorted tokens */}
                {sortedFilteredTokens.map((token: any) => {
                  const balanceInfo = showBalance ? tokenBalances.get(token.address) : undefined
                  
                  // Multi-select mode
                  if (isMultiSelect) {
                    const tokenAddressLower = token.address?.toLowerCase()
                    const isSelected = selected.some((addr) => addr.toLowerCase() === tokenAddressLower)
                    
                    const toggleToken = () => {
                      if (isSelected) {
                        onMultiChange!(selected.filter((addr) => addr.toLowerCase() !== tokenAddressLower))
                      } else {
                        onMultiChange!([...selected, tokenAddressLower])
                      }
                    }
                    
                    return (
                      <TokenRow
                        key={token.address}
                        token={token}
                        address={address}
                        isConnected={false}
                        onSelect={toggleToken as any}
                        onCopyAddress={handleCopyAddress}
                        copiedAddress={copiedAddress}
                        explorerUrl={getExplorerUrl(token.address)}
                        showBalance={false}
                        isSelected={isSelected}
                      />
                    )
                  }
                  
                  // Single select mode
                  return (
                    <TokenRow
                key={token.address}
                      token={token}
                      address={address}
                      isConnected={isConnected && showBalance}
                      onSelect={() => {
                  onChange(token.address)
                  setOpen(false)
                }}
                      onCopyAddress={handleCopyAddress}
                      copiedAddress={copiedAddress}
                      explorerUrl={getExplorerUrl(token.address)}
                      balance={balanceInfo?.balance}
                      isLoadingBalance={balanceInfo?.isLoading}
                      showBalance={showBalance}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
