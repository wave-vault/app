import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDown } from "lucide-react"
import { TokenSelector } from "./TokenSelector"
import { FactorTokenlist } from "@factordao/tokenlist"
import { useAccount, useReadContract } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
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

export function SwapInterface() {
  const [tokenIn, setTokenIn] = useState<string | null>(null)
  const [tokenOut, setTokenOut] = useState<string | null>(null)
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [isHoveringSell, setIsHoveringSell] = useState(false)
  const { chainId = 42161, isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()

  // Get selected token info first
  const selectedTokenIn = useMemo(() => {
    if (!tokenIn) return null
    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const tokens = tokenlist.getAllGeneralTokens()
      return tokens.find((t: any) => t.address?.toLowerCase() === tokenIn.toLowerCase()) || null
    } catch {
      return null
    }
  }, [tokenIn, chainId])

  // Read token balance
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: tokenIn as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenIn && !!address && isConnected,
    },
  })

  const formattedBalance = useMemo(() => {
    if (!balance || !selectedTokenIn) return "0"
    const decimals = selectedTokenIn.decimals || 18
    const balanceValue = parseFloat(formatUnits(balance as bigint, decimals))
    return balanceValue.toLocaleString(undefined, {
      maximumFractionDigits: 6,
      minimumFractionDigits: 0,
    })
  }, [balance, selectedTokenIn])

  const tokenBalance = useMemo(() => {
    if (!balance || !selectedTokenIn) return null
    const decimals = selectedTokenIn.decimals || 18
    return parseFloat(formatUnits(balance as bigint, decimals)).toString()
  }, [balance, selectedTokenIn])

  const handleSwap = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    const tempAmount = amountIn
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
  }

  const handleBalanceClick = (percentage: number) => {
    if (!tokenBalance) return
    const balance = parseFloat(tokenBalance)
    const amount = (balance * percentage).toString()
    setAmountIn(amount)
  }

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Sell Section */}
      <div 
        className="flex flex-col space-y-4"
        onMouseEnter={() => setIsHoveringSell(true)}
        onMouseLeave={() => setIsHoveringSell(false)}
      >
        {/* Header: Sell label with percentage buttons */}
        <div className="flex items-center justify-between relative">
        <label className="text-sm font-medium text-muted-foreground">Sell</label>
          {/* Percentage buttons - visible when hovering over Sell section, positioned absolutely */}
          {isConnected && tokenIn && isHoveringSell && (
            <div className="absolute right-0 top-0 flex items-center gap-1 animate-in fade-in slide-in-from-top-2 duration-200 z-10">
                <Button
                  variant="glass"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium rounded-full"
                  onClick={() => handleBalanceClick(0.25)}
                >
                  25%
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium rounded-full"
                  onClick={() => handleBalanceClick(0.5)}
                >
                  50%
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium rounded-full"
                  onClick={() => handleBalanceClick(0.75)}
                >
                  75%
                </Button>
                <Button
                  variant="glass"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium rounded-full"
                  onClick={() => handleBalanceClick(1)}
                >
                  MAX
                </Button>
              </div>
            )}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          {/* Left: Amount Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <Input
              type="number"
              placeholder="0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="text-3xl md:text-4xl font-semibold border border-border/30 bg-transparent pl-2 pr-2 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border/50 placeholder:text-muted-foreground/50 overflow-hidden text-ellipsis rounded-full"
              style={{ textOverflow: 'ellipsis' }}
            />
          </div>
          
          {/* Right: Token Selector */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <TokenSelector
              value={tokenIn}
              onChange={setTokenIn}
            />
          </div>
        </div>
        
        {/* Bottom row: $0 and Balance on same line */}
        <div className="flex items-center justify-between mt-2">
          <div>
            {amountIn && (
              <span className="text-sm text-muted-foreground">$0</span>
            )}
          </div>
          <div>
            {isConnected && tokenIn && (
              <span className="text-xs text-muted-foreground">
                Balance: {isLoadingBalance ? "..." : formattedBalance}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Swap Arrow Button */}
      <div className="flex justify-center -my-1 relative z-10">
        <Button
          variant="glass"
          size="icon"
          className="rounded-full h-10 w-10"
          onClick={handleSwap}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      </div>

      {/* Buy Section */}
      <div className="flex flex-col space-y-4">
        <label className="text-sm font-medium text-muted-foreground">Buy</label>
        <div className="flex items-center justify-between gap-4">
          {/* Left: Amount Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <Input
              type="number"
              placeholder="0"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              disabled={!tokenIn || !amountIn}
              className="text-3xl md:text-4xl font-semibold border border-border/30 bg-transparent pl-2 pr-2 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border/50 placeholder:text-muted-foreground/50 disabled:opacity-50 overflow-hidden text-ellipsis rounded-full"
              style={{ textOverflow: 'ellipsis' }}
            />
          </div>
          
          {/* Right: Token Selector */}
          <div className="flex-shrink-0">
            <TokenSelector
              value={tokenOut}
              onChange={setTokenOut}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Button
          variant="glass-apple"
          className="w-full rounded-full h-14 text-base font-medium"
          disabled={!tokenIn || !tokenOut || !amountIn}
          onClick={() => {
            if (!isConnected && openConnectModal) {
              openConnectModal()
            } else {
              // TODO: Implement swap logic
              console.log("Swap:", { tokenIn, tokenOut, amountIn, amountOut })
            }
          }}
        >
          SWAP
        </Button>
      </div>
    </div>
  )
}
