import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDown } from "lucide-react"
import { TokenSelector } from "./TokenSelector"
import { TokenBalance } from "./TokenBalance"
import { FactorTokenlist } from "@factordao/tokenlist"
import { useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"

export function SwapInterface() {
  const [tokenIn, setTokenIn] = useState<string | null>(null)
  const [tokenOut, setTokenOut] = useState<string | null>(null)
  const [amountIn, setAmountIn] = useState("")
  const [amountOut, setAmountOut] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<string | null>(null)
  const { chainId = 42161, isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()

  const handleSwap = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    const tempAmount = amountIn
    setAmountIn(amountOut)
    setAmountOut(tempAmount)
  }

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

  const handleBalanceClick = (percentage: number) => {
    if (!tokenBalance) return
    const balance = parseFloat(tokenBalance)
    const amount = (balance * percentage).toString()
    setAmountIn(amount)
  }

  const showBalanceButtons = isHovered && isConnected && tokenIn

  return (
    <div 
      className="flex flex-col w-full space-y-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sell Section */}
      <div className="flex flex-col space-y-4">
        <label className="text-sm font-medium text-muted-foreground">Sell</label>
        <div className="flex items-start justify-between gap-4">
          {/* Left: Amount Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <Input
              type="number"
              placeholder="0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="text-5xl md:text-6xl font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />
            <div className="mt-2">
              {amountIn && (
                <span className="text-sm text-muted-foreground">$0</span>
              )}
              {isConnected && tokenIn && (
                <TokenBalance
                  tokenAddress={tokenIn}
                  decimals={selectedTokenIn?.decimals}
                  userAddress={address}
                  onAmountSelect={setAmountIn}
                  onBalanceChange={setTokenBalance}
                  className="mt-1"
                />
              )}
            </div>
          </div>
          
          {/* Right: Token Selector with Balance Buttons */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0 relative">
            {/* Balance Buttons - shown on hover */}
            {showBalanceButtons && (
              <div className="flex items-center gap-1 mb-1 animate-in fade-in slide-in-from-top-2 duration-200 z-10">
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
            <TokenSelector
              value={tokenIn}
              onChange={setTokenIn}
            />
            {selectedTokenIn && (
              <span className="text-xs text-muted-foreground">- {selectedTokenIn.symbol}</span>
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
        <div className="flex items-start justify-between gap-4">
          {/* Left: Amount Input */}
          <div className="flex flex-col flex-1 min-w-0">
            <Input
              type="number"
              placeholder="0"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              disabled={!tokenIn || !amountIn}
              className="text-5xl md:text-6xl font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 disabled:opacity-50"
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
