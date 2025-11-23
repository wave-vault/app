import { cn } from '@/lib/utils'

interface FormatSmallNumberProps {
  number: number
  className?: string
  decimals?: number // Token decimals to limit decimal places shown
}

export function FormatSmallNumber({ number, className, decimals }: FormatSmallNumberProps) {
  // Convert to full decimal string representation (avoid scientific notation)
  // Use enough precision to capture the number accurately
  const numberStr = number.toFixed(20).replace(/\.?0+$/, '')
  
  // For tooltip, show full precision with proper formatting based on decimals
  const formatTooltipValue = (): string => {
    if (decimals !== undefined) {
      // Format with decimals limit for tooltip
      const maxDecimals = decimals <= 6 ? 6 : 18
      return number.toLocaleString('en-US', { 
        maximumFractionDigits: maxDecimals,
        minimumFractionDigits: 0
      })
    }
    return number.toLocaleString('en-US', { maximumFractionDigits: 18 })
  }

  // If number doesn't have decimals, return as is
  if (!numberStr.includes('.')) {
    return (
      <p 
        className={cn('cursor-help', className)} 
        title={formatTooltipValue()}
      >
        {numberStr}
      </p>
    )
  }

  const [whole, decimalPart] = numberStr.split('.')

  // If decimal part is empty, return whole number
  if (!decimalPart) {
    return (
      <p 
        className={cn('cursor-help', className)} 
        title={formatTooltipValue()}
      >
        {whole}
      </p>
    )
  }

  // Determine max significant digits based on token decimals
  // For tokens with 6 decimals (USDC), show up to 6 significant digits
  // For tokens with 18 decimals (WETH), show more precision
  const maxSignificantDigits = decimals !== undefined 
    ? (decimals <= 6 ? 6 : 10) 
    : 10

  // Count leading zeros
  const leadingZeros = decimalPart.match(/^0+/)?.[0].length || 0

  // If we have 4 or more leading zeros, use the compact notation
  if (leadingZeros >= 4) {
    const firstNonZeroIndex = decimalPart.search(/[1-9]/)
    if (firstNonZeroIndex !== -1) {
      // Limit significant digits based on token decimals
      const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + maxSignificantDigits)
      return (
        <p 
          className={cn('cursor-help', className)}
          title={formatTooltipValue()}
        >
          0.0<span className="opacity-50 text-[10px]">{leadingZeros}</span>
          {significantDigits}
        </p>
      )
    }
  }

  // For all other cases, show up to maxDecimals decimal places based on token decimals
  const maxDecimals = decimals !== undefined ? (decimals <= 6 ? 6 : 8) : 4
  const roundedNumber = Number(number)
    .toFixed(maxDecimals)
    .replace(/\.?0+$/, '')
  return (
    <p 
      className={cn('cursor-help', className)}
      title={formatTooltipValue()}
    >
      {roundedNumber}
    </p>
  )
}

