import { Deposit } from "./Deposit"
import { Withdraw } from "./Withdraw"

interface Token {
  address: string
  symbol: string
  name: string
  logoURI?: string
  decimals: number
  isDepositAsset?: boolean
  isWithdrawAsset?: boolean
}

interface Vault {
  address: string
  name: string
  chainId: number
  metadata?: {
    symbol?: string
    assetDenominatorAddress?: string
  }
  tokens?: Token[]
  pricePerShareUsd?: string
  userShares?: {
    sharesRaw?: string
    amount?: string
    amountUSD?: string
  }
}

interface VaultActionsProps {
  vault: Vault
  mode: "deposit" | "withdraw"
  availableTokens: Token[]
  onBalanceUpdate?: () => void // Callback to refresh balances after deposit/withdraw
}

export function VaultActions({ vault, mode, availableTokens, onBalanceUpdate }: VaultActionsProps) {
  if (availableTokens.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          No tokens available for {mode}
        </p>
      </div>
    )
  }

  if (mode === "deposit") {
    return <Deposit vault={vault} availableTokens={availableTokens} onBalanceUpdate={onBalanceUpdate} />
  }

  return <Withdraw vault={vault} availableTokens={availableTokens} onBalanceUpdate={onBalanceUpdate} />
}

