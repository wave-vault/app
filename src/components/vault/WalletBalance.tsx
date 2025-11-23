import { FormatSmallNumber } from './FormatSmallNumber'

interface WalletBalanceProps {
  balance: number | string // Accept both number and string to preserve precision
  tokenSymbol?: string
  label?: string
  decimals?: number // Token decimals for proper formatting
}

export function WalletBalance({
  balance,
  tokenSymbol,
  label = 'Wallet balance:',
  decimals,
}: WalletBalanceProps) {
  // Convert to number if string (for comparison)
  // If balance is a string, parseFloat will maintain precision for small numbers
  // If balance is already a number (even in scientific notation), use it directly
  const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance
  
  // Handle NaN or zero
  if (isNaN(balanceNum) || balanceNum === 0) {
    return (
      <div className="flex flex-col items-start">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-foreground text-xs">0 {tokenSymbol}</span>
      </div>
    )
  }
  
  // Check if number is very small (less than 0.0001) but not zero - exactly like reference
  const isVerySmallNumber = balanceNum > 0 && balanceNum < 0.0001

  // Format normal numbers based on token decimals
  const formatNormalNumber = (bal: number): string => {
    if (decimals !== undefined) {
      // For tokens with 6 decimals (like USDC), show up to 6 decimal places
      // For tokens with 18 decimals (like WETH), show up to 8 decimal places for readability
      const maxDecimals = decimals <= 6 ? 6 : 8
      
      return bal.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      })
    }
    
    // Fallback: standard formatting
    return bal.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    })
  }

  return (
    <div className="flex flex-col items-start">
      <p className="text-sm text-muted-foreground">{label}</p>
      {isVerySmallNumber ? (
        <div className="flex items-center gap-1">
          <FormatSmallNumber 
            number={balanceNum} 
            className="text-foreground text-xs"
            decimals={decimals} // Pass decimals to limit decimal places
          />
          <span className="text-foreground text-xs">{tokenSymbol}</span>
        </div>
      ) : (
        <span className="text-foreground text-xs">
          {formatNormalNumber(balanceNum)} {tokenSymbol}
        </span>
      )}
    </div>
  )
}

