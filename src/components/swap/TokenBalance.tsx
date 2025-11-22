import { useEffect } from "react"
import { useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { cn } from "@/lib/utils"

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

interface TokenBalanceProps {
  tokenAddress: string | null
  decimals?: number
  userAddress: string | undefined
  onBalanceChange?: (balance: string) => void
  className?: string
  showPercentButtons?: boolean
}

export function TokenBalance({
  tokenAddress,
  decimals = 18,
  userAddress,
  onBalanceChange,
  className,
}: TokenBalanceProps) {

  const { data: balance, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
    },
  })

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance as bigint, decimals))
    : 0

  const displayBalance = formattedBalance > 0
    ? formattedBalance.toLocaleString(undefined, {
        maximumFractionDigits: 6,
        minimumFractionDigits: 0,
      })
    : "0"

  // Notify parent of balance change
  useEffect(() => {
    if (onBalanceChange && formattedBalance > 0) {
      onBalanceChange(formattedBalance.toString())
    } else if (onBalanceChange && formattedBalance === 0) {
      onBalanceChange("0")
    }
  }, [formattedBalance, onBalanceChange])

  if (!tokenAddress || !userAddress) {
    return null
  }

  return (
    <div className={cn("relative", className)}>
      <span className="text-xs text-muted-foreground">
        Balance: {isLoading ? "..." : displayBalance}
      </span>
    </div>
  )
}

