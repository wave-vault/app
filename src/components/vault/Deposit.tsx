import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Loader2 } from 'lucide-react'
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
import { getBaseRpcUrl } from '@/lib/constants/rpc'

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
}


export function Deposit({ vault, availableTokens }: DepositProps) {
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
      refreshBalance()
      setDepositAmount('')
    },
  })

  // Set initial token
  useEffect(() => {
    if (availableTokens && availableTokens.length > 0 && !token) {
      setToken(availableTokens[0])
    }
  }, [availableTokens, token])

  const refreshBalance = useCallback(() => {
    setBalanceRefreshTrigger((prev) => prev + 1)
  }, [])

  // Fetch balance
  useEffect(() => {
    if (!token?.address || !address) {
      return
    }

    let cancelled = false

    const fetchBalance = async (retryCount = 0) => {
      const MAX_RETRIES = 2

      try {
        setTokenBalance('0')
        setBalanceError(false)
        setIsLoadingBalance(true)
        const rpcUrl = getBaseRpcUrl()

        const client = createPublicClient({
          chain: base,
          transport: http(rpcUrl, {
            timeout: 30_000,
          }),
        }).extend(publicActions)

        const balance = await client.readContract({
          address: token.address as Address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as Address],
        })

        if (!cancelled) {
          const formattedBalance = formatUnits(balance as bigint, token.decimals || 18)
          setTokenBalance(formattedBalance)
          setBalanceError(false)
        }
      } catch (error: any) {
        if (!cancelled) {
          if (retryCount < MAX_RETRIES && error?.message?.includes('timeout')) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return fetchBalance(retryCount + 1)
          }
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
  }, [token?.address, address, token?.decimals, balanceRefreshTrigger])

  // Debounced deposit estimate
  useEffect(() => {
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !token) {
      setDepositEstimate(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const proVault = new StudioProVault({
          chainId: 8453, // BASE
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
  }, [depositAmount, token?.address, token?.decimals, vault.address])

  const formattedBalance = parseFloat(tokenBalance || '0')

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
            <span className="text-xs text-yellow-600 dark:text-yellow-500" title="Could not fetch balance from RPC">
              ⚠️
            </span>
          </div>
        ) : (
          <WalletBalance
            balance={formattedBalance}
            tokenSymbol={token?.symbol || availableTokens?.[0]?.symbol || ''}
            label="Wallet balance:"
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
            setDepositAmount((formattedBalance * (percentage / 100)).toString())
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

