import { useState, useMemo } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface Pair {
  tokenA: {
    symbol: string
    logoURI?: string
    logoUrl?: string
    address: string
  }
  tokenB: {
    symbol: string
    logoURI?: string
    logoUrl?: string
    address: string
  }
  id: string // Unique identifier for the pair (e.g., "tokenA_address-tokenB_address")
}

export interface SelectedPair {
  pairId: string
  fee: number
}

interface PairSelectorProps {
  pairs: Pair[]
  selected: SelectedPair[] // Array of selected pairs with fees
  onMultiChange: (selectedPairs: SelectedPair[]) => void
  className?: string
  title?: string
}

interface PairRowProps {
  pair: Pair
  isSelected: boolean
  fee: number
  onSelect: () => void
  onFeeChange: (fee: number) => void
}

function PairRow({ pair, isSelected, fee, onSelect, onFeeChange }: PairRowProps) {
  const [isManualInput, setIsManualInput] = useState(false)
  const [manualInputValue, setManualInputValue] = useState("")
  
  // Check if current fee matches one of the preset values
  const presetFees = [0.01, 0.1, 0.5]
  const isPresetSelected = presetFees.includes(fee)

  const handlePresetClick = (presetFee: number) => {
    setIsManualInput(false)
    setManualInputValue("")
    onFeeChange(presetFee)
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.')
    
    // Allow empty string or valid number format
    if (value === "" || value === "-" || value === ".") {
      setManualInputValue(value)
      // Don't update fee if input is empty or incomplete
      return
    }
    
    // Check if it's a valid number
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setManualInputValue(value)
      onFeeChange(numValue)
    } else if (value === "") {
      setManualInputValue("")
      onFeeChange(0)
    }
  }

  const handleManualButtonClick = () => {
    setIsManualInput(true)
    if (isPresetSelected) {
      setManualInputValue("")
      onFeeChange(0)
    } else {
      // If already in manual mode with a value, show it
      setManualInputValue(fee > 0 ? fee.toString() : "")
    }
  }

  // Update manual input value when fee changes externally (but not from manual input)
  React.useEffect(() => {
    if (!isManualInput && isPresetSelected) {
      setManualInputValue("")
    }
  }, [fee, isManualInput, isPresetSelected])

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
        onClick={onSelect}
      >
        {/* Left: Token A Logo + Symbol / Token B Logo + Symbol */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Token A */}
          <div className="flex items-center gap-2">
            {(pair.tokenA.logoURI || pair.tokenA.logoUrl) ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={pair.tokenA.logoURI || pair.tokenA.logoUrl}
                  alt={pair.tokenA.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  {pair.tokenA.symbol?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="font-medium text-sm">{pair.tokenA.symbol}</span>
          </div>

          {/* Separator */}
          <span className="text-muted-foreground">/</span>

          {/* Token B */}
          <div className="flex items-center gap-2">
            {(pair.tokenB.logoURI || pair.tokenB.logoUrl) ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={pair.tokenB.logoURI || pair.tokenB.logoUrl}
                  alt={pair.tokenB.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">
                  {pair.tokenB.symbol?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <span className="font-medium text-sm">{pair.tokenB.symbol}</span>
          </div>
        </div>

        {/* Right: Checkbox */}
        <div className="text-right flex-shrink-0">
          {isSelected ? (
            <div className="w-4 h-4 rounded-full bg-primary" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
          )}
        </div>
      </div>
      
      {/* Fee Selector - only show when selected */}
      {isSelected && (
        <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">
              Fee:
            </Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={fee === 0.01 ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetClick(0.01)}
                className="h-5 px-2 text-[10px] rounded-full min-w-[36px]"
              >
                0.01%
              </Button>
              <Button
                type="button"
                variant={fee === 0.1 ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetClick(0.1)}
                className="h-5 px-2 text-[10px] rounded-full min-w-[36px]"
              >
                0.1%
              </Button>
              <Button
                type="button"
                variant={fee === 0.5 ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePresetClick(0.5)}
                className="h-5 px-2 text-[10px] rounded-full min-w-[36px]"
              >
                0.5%
              </Button>
              <Button
                type="button"
                variant={isManualInput && !isPresetSelected ? "default" : "ghost"}
                size="sm"
                onClick={handleManualButtonClick}
                className="h-5 px-2 text-[10px] rounded-full min-w-[50px]"
              >
                Manual
              </Button>
              {isManualInput && (
                <Input
                  id={`fee-${pair.id}`}
                  variant="glass"
                  type="text"
                  inputMode="decimal"
                  value={manualInputValue}
                  onChange={handleManualInputChange}
                  className="h-5 text-xs px-2 py-0 w-16"
                  placeholder="0.0"
                  autoFocus
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function PairSelector({ pairs, selected, onMultiChange, className, title = "Select Pairs" }: PairSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredPairs = useMemo(() => {
    if (!search) return pairs

    const searchLower = search.toLowerCase()
    return pairs.filter((pair) => {
      const tokenASymbol = pair.tokenA.symbol?.toLowerCase() || ''
      const tokenBSymbol = pair.tokenB.symbol?.toLowerCase() || ''
      return tokenASymbol.includes(searchLower) || tokenBSymbol.includes(searchLower)
    })
  }, [pairs, search])

  const selectedPairIds = useMemo(() => {
    return selected.map((sp) => sp.pairId)
  }, [selected])

  const togglePair = (pairId: string) => {
    const isSelected = selectedPairIds.includes(pairId)
    if (isSelected) {
      onMultiChange(selected.filter((sp) => sp.pairId !== pairId))
    } else {
      // Set default fee to 0.01 when pair is selected
      onMultiChange([...selected, { pairId, fee: 0.01 }])
    }
  }

  const selectAll = () => {
    const allPairIds = filteredPairs.map((p) => p.id)
    const newSelected = allPairIds.map((pairId) => {
      const existing = selected.find((sp) => sp.pairId === pairId)
      // If existing has fee > 0, keep it, otherwise set default to 0.01
      return existing || { pairId, fee: 0.01 }
    })
    onMultiChange(newSelected)
  }

  const deselectAll = () => {
    onMultiChange([])
  }

  const updateFee = (pairId: string, fee: number) => {
    const updated = selected.map((sp) =>
      sp.pairId === pairId ? { ...sp, fee } : sp
    )
    onMultiChange(updated)
  }

  const getFeeForPair = (pairId: string): number => {
    const selectedPair = selected.find((sp) => sp.pairId === pairId)
    return selectedPair?.fee || 0
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="glass"
          className={cn(
            "w-full justify-between",
            className
          )}
        >
          <span>Select pairs ({selected.length} selected)</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent variant="glass-apple" className="max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            {filteredPairs.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedPairIds.length < filteredPairs.length ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="h-7 px-2 text-xs"
                  >
                    Select All
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="h-7 px-2 text-xs"
                  >
                    Deselect All
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            variant="glass"
            placeholder="Search pair..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-[400px] overflow-y-auto space-y-1 scrollbar-hide">
            {filteredPairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pairs found
              </div>
            ) : (
              filteredPairs.map((pair) => {
                const isSelected = selectedPairIds.includes(pair.id)
                const fee = getFeeForPair(pair.id)
                return (
                  <PairRow
                    key={pair.id}
                    pair={pair}
                    isSelected={isSelected}
                    fee={fee}
                    onSelect={() => togglePair(pair.id)}
                    onFeeChange={(newFee) => updateFee(pair.id, newFee)}
                  />
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

