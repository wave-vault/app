import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SLIPPAGE_PRESETS } from '@/lib/constants/swap'

interface SlippageSelectorProps {
  slippage: number // in percentage (e.g., 1 for 1%)
  onSlippageChange: (slippage: number) => void
  className?: string
}

export function SlippageSelector({
  slippage,
  onSlippageChange,
  className,
}: SlippageSelectorProps) {
  const [isManualInput, setIsManualInput] = useState(false)
  const [manualInputValue, setManualInputValue] = useState('')

  // Check if current slippage matches one of the preset values
  const isPresetSelected = SLIPPAGE_PRESETS.includes(slippage as any)

  const handlePresetClick = (presetSlippage: number) => {
    setIsManualInput(false)
    setManualInputValue('')
    onSlippageChange(presetSlippage)
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Replace comma with dot for decimal separator
    value = value.replace(/,/g, '.')

    // Allow empty string or valid number format
    if (value === '' || value === '-' || value === '.') {
      setManualInputValue(value)
      // Don't update slippage if input is empty or incomplete
      return
    }

    // Check if it's a valid number
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      setManualInputValue(value)
      onSlippageChange(numValue)
    } else if (value === '') {
      setManualInputValue('')
      onSlippageChange(0)
    }
  }

  const handleManualButtonClick = () => {
    setIsManualInput(true)
    if (isPresetSelected) {
      setManualInputValue('')
      onSlippageChange(0)
    } else {
      // If already in manual mode with a value, show it
      setManualInputValue(slippage > 0 ? slippage.toString() : '')
    }
  }

  // Update manual input value when slippage changes externally (but not from manual input)
  useEffect(() => {
    if (!isManualInput && isPresetSelected) {
      setManualInputValue('')
    }
  }, [slippage, isManualInput, isPresetSelected])

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">
          Slippage:
        </Label>
        <div className="flex items-center gap-1">
          {SLIPPAGE_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={slippage === preset ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className="h-5 px-2 text-[10px] rounded-full min-w-[36px]"
            >
              {preset}%
            </Button>
          ))}
          <Button
            type="button"
            variant={isManualInput && !isPresetSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={handleManualButtonClick}
            className="h-5 px-2 text-[10px] rounded-full min-w-[50px]"
          >
            Manual
          </Button>
          {isManualInput && (
            <Input
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
  )
}

