import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, TrendingUp } from "lucide-react"
import type { AquaPairWithTvl } from "@/lib/utils/swap"

interface PairSelectorProps {
  pairs: AquaPairWithTvl[]
  selectedPairHash: string | null
  onPairSelect: (pairHash: string) => void
}

export function PairSelector({ pairs, selectedPairHash, onPairSelect }: PairSelectorProps) {
  const selectedPair = pairs.find(p => p.pairHash.toLowerCase() === selectedPairHash?.toLowerCase())

  const formatTvl = (tvlUsd?: string) => {
    if (!tvlUsd) return "N/A"
    const tvl = parseFloat(tvlUsd)
    if (tvl >= 1_000_000) {
      return `$${(tvl / 1_000_000).toFixed(2)}M`
    } else if (tvl >= 1_000) {
      return `$${(tvl / 1_000).toFixed(2)}K`
    } else {
      return `$${tvl.toFixed(2)}`
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (pairs.length <= 1) {
    return null // Don't show selector if there's only one or no pairs
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="glass"
          size="sm"
          className="w-full justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            <span>
              {selectedPair 
                ? `Vault: ${formatAddress(selectedPair.vault)} (TVL: ${formatTvl(selectedPair.tvlUsd)})`
                : "Select Pair"
              }
            </span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>Select Liquidity Pool</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedPairHash || undefined}
          onValueChange={onPairSelect}
        >
          {pairs.map((pair) => (
            <DropdownMenuRadioItem
              key={pair.pairHash}
              value={pair.pairHash}
              className="flex flex-col items-start gap-1 py-2"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-sm">
                  {formatAddress(pair.vault)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTvl(pair.tvlUsd)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Fee: {(parseFloat(pair.feeBps) / 100).toFixed(2)}%
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

