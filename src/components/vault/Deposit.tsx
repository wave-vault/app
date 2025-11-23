import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { Address, createPublicClient, erc20Abi, formatUnits, parseUnits, http, publicActions } from 'viem'
import { base } from 'viem/chains'
import { StudioProVault } from '@factordao/sdk-studio'
// Type definition for deposit preview result
type StudioProVaultPreviewDespositResult = any
import { useProVaultDeposit } from '@/hooks/useProVaultDeposit'
import { ActionPreview } from './ActionPreview'
import { PercentageSelector } from './PercentageSelector'
import { WalletBalance } from './WalletBalance'
import { environment } from '@/lib/constants/dev'
import { getBaseRpcUrl, BASE_CHAIN_ID } from '@/lib/constants/rpc'

interface Token {
  address: string
  symbol: string
  name: string
  logoURI?: string
  decimals: number
  isDepositAsset?: boolean
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
}

interface DepositProps {
  vault: Vault
  availableTokens: Token[]
  onBalanceUpdate?: () => void // Callback to refresh balances after deposit
}


export function Deposit({ vault, availableTokens, onBalanceUpdate }: DepositProps) {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [depositAmount, setDepositAmount] = useState('')
  const [token, setToken] = useState<Token | undefined>(availableTokens[0])
  const [tokenBalance, setTokenBalance] = useState('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0)
  const [balanceError, setBalanceError] = useState(false)
  const [depositEstimate, setDepositEstimate] = useState<StudioProVaultPreviewDespositResult | null>(null)

  // useProVaultDeposit uses depositAssetAndExecute which automatically:
  // 1. Deposits the user's tokens into the vault
  // 2. Executes any configured deposit strategy (e.g., publishPairs for Aqua vaults)
  // This ensures liquidity is updated on Aqua protocol after each deposit
  const {
    handleDepositWithApproval,
    isLoading,
    steps, // Steps state for stepper UI
  } = useProVaultDeposit({
    vaultAddress: vault.address as Address,
    token: token
      ? {
          address: token.address as Address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
        }
      : undefined,
    amount: depositAmount,
    receiverAddress: address as Address,
    onSuccess: () => {
      // Refresh token balance
      refreshBalance()
      // Refresh shares balance
      onBalanceUpdate?.()
      // Clear deposit amount
      setDepositAmount('')
      // Reset steps after showing success for 2 seconds
      setTimeout(() => {
        // Steps will be reset when user starts a new deposit
      }, 2000)
    },
  })

  // Set initial token ONLY when depositTokens first loads
  useEffect(() => {
    if (availableTokens && availableTokens.length > 0 && !token) {
      setToken(availableTokens[0])
    }
  }, [availableTokens, token])

  // Manual refresh function for after deposit
  const refreshBalance = useCallback(() => {
    setBalanceRefreshTrigger(prev => prev + 1)
  }, [])

  // Determine target chain from vault chainId
  const targetChain = useMemo(() => {
    // For now, we only support Base chain (8453)
    // If vault is on Base, use base chain config
    if (vault.chainId === BASE_CHAIN_ID || vault.chainId === 8453) {
      return base
    }
    // Fallback to base if chainId is not recognized
    return base
  }, [vault.chainId])

  // ✅ Fetch balance ONLY when token address or wallet address changes - exactly like reference
  useEffect(() => {
    if (!token?.address || !address || !vault.chainId || !targetChain) {
      return
    }

    let cancelled = false

    const fetchBalance = async (retryCount = 0) => {
      const MAX_RETRIES = 2
      
      try {
        // Reset balance immediately to avoid showing stale data
        setTokenBalance('0')
        setBalanceError(false)
        setIsLoadingBalance(true)
        const rpcUrl = getBaseRpcUrl()

        // Create a client connected to the correct chain with longer timeout
        const client = createPublicClient({
          chain: targetChain,
          transport: http(rpcUrl, {
            timeout: 30_000, // 30 seconds timeout
          }),
        }).extend(publicActions)

        // Read the ERC20 token balance
        const balance = await client.readContract({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as Address],
        })

        if (!cancelled) {
          // Format the balance with correct decimals
          // formatUnits returns a string, which we keep as string to avoid precision issues
          const formattedBalance = formatUnits(balance as bigint, token.decimals || 18)
          setTokenBalance(formattedBalance)
          setBalanceError(false)
        }
      } catch (error: any) {
        if (!cancelled) {
          // Retry logic for timeout errors
          if (retryCount < MAX_RETRIES && error?.message?.includes('timeout')) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s before retry
            return fetchBalance(retryCount + 1)
          }
          
          // If all retries failed or non-timeout error, show 0 balance
          setTokenBalance('0')
          setBalanceError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBalance(false)
        }
      }
    }

    fetchBalance()

    return () => {
      cancelled = true
    }
  }, [token?.address, address, vault.chainId, targetChain, token?.decimals, balanceRefreshTrigger])

  // Format balance as number for calculations
  // tokenBalance is already formatted with correct decimals from formatUnits
  // Convert to number for calculations, but preserve precision
  const formattedBalance = useMemo(() => {
    if (!tokenBalance || tokenBalance === '0') return 0
    // Parse the string balance to number
    // formatUnits already handled the decimals correctly based on token.decimals
    const num = parseFloat(tokenBalance)
    return isNaN(num) ? 0 : num
  }, [tokenBalance])

  // Debounced deposit estimate
  useEffect(() => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !token) {
      setDepositEstimate(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const proVault = new StudioProVault({
          chainId: vault.chainId || BASE_CHAIN_ID,
          vaultAddress: vault.address as Address,
          environment: environment,
          jsonRpcUrl: getBaseRpcUrl(),
        })
        const estimation = await proVault.previewDeposit({
          assetAddress: token.address as Address,
          assetAmountBN: parseUnits(depositAmount, token.decimals || 18).toString(),
        })
        setDepositEstimate(estimation)
      } catch (error) {
        setDepositEstimate(null)
      }
    }, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [depositAmount, token?.address, token?.decimals, vault.address, vault.chainId])


  const denominatorDecimals = useMemo(() => {
    if (!vault.metadata?.assetDenominatorAddress || !vault.tokens) return 18

    const denominatorAddress = vault.metadata.assetDenominatorAddress.toLowerCase()
    const denominatorToken = vault.tokens.find(
      (t) => t.address?.toLowerCase() === denominatorAddress
    )

    return denominatorToken?.decimals || 18
  }, [vault.metadata?.assetDenominatorAddress, vault.tokens])


  const handleDeposit = async () => {
    if (!isConnected && openConnectModal) {
      openConnectModal()
      return
    }
    if (!isConnected) return
    await handleDepositWithApproval()
  }

  const isConnected = !!address

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        {availableTokens && availableTokens.length > 0 ? (
          <Select
            value={token?.address}
            onValueChange={(value) => {
              const selectedToken = availableTokens.find((t) => t.address === value)
              setToken(selectedToken)
            }}
          >
            <SelectTrigger className="glass w-fit">
              <SelectValue>
                {token && (
                  <div className="flex items-center gap-2">
                    {token.logoURI && (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span>{token.symbol}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="glass-apple">
              {availableTokens.map((t) => (
                <SelectItem key={t.address} value={t.address}>
                  <div className="flex items-center gap-2">
                    {t.logoURI && (
                      <img
                        src={t.logoURI}
                        alt={t.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span>{t.symbol}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <Skeleton className="w-5 h-5 rounded-full" />
            <span className="text-gray-500">Loading deposit options...</span>
          </div>
        )}
        {isLoadingBalance ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Wallet balance:</span>
            <Skeleton className="w-16 h-4" />
          </div>
        ) : balanceError ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-yellow-600 dark:text-yellow-500">Wallet balance: ~</span>
            <span className="text-xs text-yellow-600 dark:text-yellow-500" title="Could not fetch balance from RPC">⚠️</span>
          </div>
        ) : (
          <WalletBalance
            balance={tokenBalance} // Pass as string to preserve precision
            tokenSymbol={token?.symbol || availableTokens?.[0]?.symbol || 'FCTR'}
            label="Wallet balance:"
            decimals={token?.decimals} // Pass decimals for proper formatting
          />
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-5 w-full bg-white dark:bg-[#1B1E20] border border-gray-200 dark:border-gray-700 ring-0 outline-none text-foreground px-2 rounded-lg">
          <Input
            id="depositAmount"
            type="number"
            placeholder="Enter deposit amount..."
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex items-center gap-5 w-full bg-white dark:bg-[#1B1E20] !border-0 ring-0 outline-none text-foreground"
          />
        </div>

        <PercentageSelector
          onPercentageChange={(percentage) => {
            // Calculate amount based on percentage of balance
            // formattedBalance is already calculated with correct decimals from formatUnits
            const amount = formattedBalance * (percentage / 100)
            
            // Format to string, preserving appropriate decimal places
            // For tokens with 6 decimals (USDC), show up to 6 decimals
            // For tokens with 18 decimals (WETH), show up to 8 decimals for readability
            const tokenDecimals = token?.decimals || 18
            const maxDecimals = tokenDecimals <= 6 ? 6 : 8
            
            // Convert to string and remove trailing zeros
            const amountStr = amount.toFixed(maxDecimals)
            setDepositAmount(parseFloat(amountStr).toString())
          }}
        />
      </div>

      {depositEstimate && (
        <ActionPreview
          title="Deposit Preview"
          receivedShares={Number(
            formatUnits(BigInt(depositEstimate?.shareAmountBN || '0'), denominatorDecimals)
          )}
          tokenSymbol={vault.metadata?.symbol || vault.name}
          sharesString={formatUnits(depositEstimate?.shareAmountBN as any, denominatorDecimals)}
          rawValue={formatUnits(BigInt(depositEstimate?.shareAmountBN || '0'), 18)}
        />
      )}

      {/* Deposit Stepper - Shows approve and deposit steps */}
      {(isLoading || steps.approve !== 'idle' || steps.deposit !== 'idle') && (
        <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="text-xs font-medium text-muted-foreground mb-2">Transaction Steps</div>
          
          {/* Step 1: Approve */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {steps.approve === 'loading' && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {steps.approve === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {steps.approve === 'error' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {steps.approve === 'idle' && (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${
                steps.approve === 'loading' ? 'text-primary' :
                steps.approve === 'success' ? 'text-green-500' :
                steps.approve === 'error' ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
                Approve {token?.symbol || 'Token'}
              </div>
              {steps.approve === 'loading' && (
                <div className="text-xs text-muted-foreground">Waiting for approval...</div>
              )}
              {steps.approve === 'success' && (
                <div className="text-xs text-green-500/70">Approved</div>
              )}
              {steps.approve === 'error' && (
                <div className="text-xs text-red-500/70">Approval failed</div>
              )}
            </div>
          </div>

          {/* Step 2: Deposit */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {steps.deposit === 'loading' && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {steps.deposit === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {steps.deposit === 'error' && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              {steps.deposit === 'idle' && (
                <Circle className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${
                steps.deposit === 'loading' ? 'text-primary' :
                steps.deposit === 'success' ? 'text-green-500' :
                steps.deposit === 'error' ? 'text-red-500' :
                'text-muted-foreground'
              }`}>
                Deposit
              </div>
              {steps.deposit === 'loading' && (
                <div className="text-xs text-muted-foreground">Depositing tokens...</div>
              )}
              {steps.deposit === 'success' && (
                <div className="text-xs text-green-500/70">Deposit successful</div>
              )}
              {steps.deposit === 'error' && (
                <div className="text-xs text-red-500/70">Deposit failed</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        className="w-full h-10 rounded-full bg-accent"
        disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
        onClick={handleDeposit}
      >
        {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Deposit'}
      </Button>
    </div>
  )
}

