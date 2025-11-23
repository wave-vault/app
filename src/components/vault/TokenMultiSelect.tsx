import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { ChevronDown } from "lucide-react"
import { BASE_WHITELISTED_TOKENS, getBaseTokenByAddress } from "@/lib/constants/baseTokens"
import { FactorTokenlist } from "@factordao/tokenlist"
import { useAccount } from "wagmi"

interface TokenMultiSelectProps {
  selected: string[]
  onChange: (tokens: string[]) => void
}

export function TokenMultiSelect({ selected, onChange }: TokenMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { chainId = 8453 } = useAccount() // Default to BASE

  // Get tokens from FactorTokenlist and filter by whitelist
  const availableTokens = useMemo(() => {
    // Get whitelisted addresses (filter out placeholders)
    const validWhitelistedTokens = BASE_WHITELISTED_TOKENS.filter((token) => {
      const isPlaceholder = 
        token.address === "0x0000000000000000000000000000000000000000" ||
        token.address.startsWith("0xcbB7C000") ||
        token.address.length !== 42
      return !isPlaceholder
    })

    try {
      // Get all tokens from FactorTokenlist for BASE chain
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      
      // For each whitelisted token, try to find it in the tokenlist
      const foundTokens = validWhitelistedTokens.map((whitelistedToken) => {
        const whitelistedAddress = whitelistedToken.address.toLowerCase()
        
        // First try: getToken by address
        try {
          const token = tokenlist.getToken(whitelistedToken.address as `0x${string}`)
          if (token) {
            const tokenAny = token as any
            return {
              symbol: tokenAny.symbol || whitelistedToken.symbol,
              name: tokenAny.name || whitelistedToken.name,
              address: whitelistedAddress,
              decimals: tokenAny.decimals || whitelistedToken.decimals,
              logoUrl: tokenAny.logoUrl || tokenAny.logoURI || whitelistedToken.logoURI || '',
              logoURI: tokenAny.logoUrl || tokenAny.logoURI || whitelistedToken.logoURI || '',
            }
          }
        } catch (e) {
          // Continue to fallback
        }
        
        // Second try: search in getAllGeneralTokens
        const foundInList = allTokens.find((token: any) => 
          token.address?.toLowerCase() === whitelistedAddress
        )
        
        if (foundInList) {
          const tokenAny = foundInList as any
          return {
            symbol: tokenAny.symbol || whitelistedToken.symbol,
            name: tokenAny.name || whitelistedToken.name,
            address: whitelistedAddress,
            decimals: tokenAny.decimals || whitelistedToken.decimals,
            logoUrl: tokenAny.logoUrl || tokenAny.logoURI || whitelistedToken.logoURI || '',
            logoURI: tokenAny.logoUrl || tokenAny.logoURI || whitelistedToken.logoURI || '',
          }
        }
        
        // Fallback: use whitelisted token data
        return {
          symbol: whitelistedToken.symbol,
          name: whitelistedToken.name,
          address: whitelistedAddress,
          decimals: whitelistedToken.decimals,
          logoUrl: whitelistedToken.logoURI || '',
          logoURI: whitelistedToken.logoURI || '',
        }
      })
      
      return foundTokens
    } catch (error) {
      // Fallback to whitelist only if tokenlist fails
      return validWhitelistedTokens.map((token) => ({
        symbol: token.symbol,
        name: token.name,
        address: token.address.toLowerCase(),
        decimals: token.decimals,
        logoUrl: token.logoURI || '',
        logoURI: token.logoURI || '',
      }))
    }
  }, [chainId])

  const filteredTokens = availableTokens.filter((token: any) =>
    token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
    token.name?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedTokens = useMemo(() => {
    return selected
      .map((addr) => {
        // Always use BASE token lookup for vault creation
        return getBaseTokenByAddress(addr) || availableTokens.find((t: any) => 
          t.address?.toLowerCase() === addr.toLowerCase()
        )
      })
      .filter(Boolean)
  }, [selected, availableTokens])

  const toggleToken = (tokenAddress: string) => {
    const addressLower = tokenAddress.toLowerCase()
    if (selected.includes(addressLower)) {
      onChange(selected.filter((addr) => addr !== addressLower))
    } else {
      onChange([...selected, addressLower])
    }
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="glass"
            className="w-full justify-between"
          >
            <span>Select tokens ({selected.length} selected)</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent variant="glass-apple" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Tokens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              variant="glass"
              placeholder="Search token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {availableTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No whitelisted tokens available</p>
                  <p className="text-xs mt-2">Please check your connection to BASE chain</p>
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tokens found matching "{search}"</p>
                  <p className="text-xs mt-2">Showing only whitelisted tokens for BASE chain</p>
                </div>
              ) : (
                filteredTokens.map((token: any) => {
                  const tokenAddressLower = token.address?.toLowerCase()
                  const isSelected = selected.some((addr) => addr.toLowerCase() === tokenAddressLower)
                  return (
                    <Button
                      key={token.address}
                      variant={isSelected ? "glass-apple" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => toggleToken(token.address)}
                    >
                      {token.logoUrl && (
                        <img
                          src={token.logoUrl}
                          alt={token.symbol}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div className="flex flex-col items-start flex-1">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{token.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-aqua-500" />
                      )}
                    </Button>
                  )
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected tokens chips */}
      {selectedTokens.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 glass rounded-lg">
          {selectedTokens.map((token: any) => (
            <Badge
              key={token.address}
              variant="secondary"
              className="glass flex items-center gap-1"
            >
              {(token.logoUrl || token.logoURI) && (
                <img
                  src={token.logoUrl || token.logoURI}
                  alt={token.symbol}
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span>{token.symbol}</span>
              <button
                onClick={() => toggleToken(token.address)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

