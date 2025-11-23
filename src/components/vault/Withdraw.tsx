import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Loader2, Settings } from 'lucide-react'
import { Address, formatUnits, parseUnits } from 'viem'
import { StudioProVault } from '@factordao/sdk-studio'
// Type definition for withdraw preview result
type StudioProVaultPreviewWithdrawResult = any
import { useProVaultWithdraw } from '@/hooks/useProVaultWithdraw'
import { ActionPreview } from './ActionPreview'
import { PercentageSelector } from './PercentageSelector'
import { WalletBalance } from './WalletBalance'
import { environment } from '@/lib/constants/dev'
import { getBaseRpcUrl, BASE_CHAIN_ID } from '@/lib/constants/rpc'
import { useRef } from 'react'

interface Token {
  address: string
  symbol: string
  name: string
  logoURI?: string
  decimals: number
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

interface WithdrawProps {
  vault: Vault
  availableTokens: Token[]
  onBalanceUpdate?: () => void // Callback to refresh balances after withdraw
}

const formatUsdCompact = (value: number): string => {
  if (value === 0) return '0.00'
  if (value < 0.01) return '<0.01'
  if (value < 1000) {
    return value.toFixed(2)
  }
  if (value < 1000000) {
    const kValue = value / 1000
    if (kValue < 10) {
      return kValue % 1 === 0 ? kValue.toFixed(0) + 'k' : kValue.toFixed(2).replace(/\.?0+$/, '') + 'k'
    }
    return kValue.toFixed(2).replace(/\.?0+$/, '') + 'k'
  }
  const mValue = value / 1000000
  return mValue.toFixed(2).replace(/\.?0+$/, '') + 'm'
}

export function Withdraw({ vault, availableTokens, onBalanceUpdate }: WithdrawProps) {
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [token, setToken] = useState<Token | undefined>(availableTokens[0])
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [slippage, setSlippage] = useState('1.5')
  const settingsRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSlippageSettings(false)
      }
    }

    if (showSlippageSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSlippageSettings])

  const { handleWithdraw: onWithdraw, isWaitingForWithdraw } = useProVaultWithdraw({
    vaultAddress: vault.address as Address,
    tokenAddress: token?.address as Address,
    withdrawAmount,
    depositorAddress: address as Address,
    receiverAddress: address as Address,
    slippageTolerance: slippage,
    onSuccess: () => {
      // Refresh shares balance after withdraw
      onBalanceUpdate?.()
      // Clear withdraw amount
      setWithdrawAmount('')
    },
  })

  const [withdrawEstimate, setWithdrawEstimate] = useState<StudioProVaultPreviewWithdrawResult | null>(null)

  // Set initial token
  useEffect(() => {
    if (availableTokens && availableTokens.length > 0 && !token) {
      const withdrawableTokens = availableTokens.filter((t) => t.isWithdrawAsset)
      if (withdrawableTokens.length > 0) {
        setToken(withdrawableTokens[0])
      } else if (availableTokens.length > 0) {
        setToken(availableTokens[0])
      }
    }
  }, [availableTokens, token])

  const denominatorDecimals = useMemo(() => {
    if (!vault.metadata?.assetDenominatorAddress || !vault.tokens) return 18

    const denominatorAddress = vault.metadata.assetDenominatorAddress.toLowerCase()
    const denominatorToken = vault.tokens.find(
      (t) => t.address?.toLowerCase() === denominatorAddress
    )

    return denominatorToken?.decimals || 18
  }, [vault.metadata?.assetDenominatorAddress, vault.tokens])

  const shares = useMemo(() => {
    if (vault.userShares?.sharesRaw) {
      return vault.userShares.sharesRaw
    }
    return '0'
  }, [vault.userShares?.sharesRaw])

  const handlePreviewWithdraw = useCallback(async () => {
    if (!token || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return null
    try {
      const proVault = new StudioProVault({
        chainId: vault.chainId || BASE_CHAIN_ID,
        vaultAddress: vault.address as Address,
        environment: environment,
        jsonRpcUrl: getBaseRpcUrl(),
      })
      const withdrawEstimate = await proVault.previewWithdraw({
        assetAddress: token.address as Address,
        shareAmountBN: parseUnits(withdrawAmount, denominatorDecimals).toString(),
      })
      return withdrawEstimate
    } catch (error) {
      return null
    }
  }, [token, withdrawAmount, denominatorDecimals, vault.address, vault.chainId])

  // Debounced withdraw estimate
  useEffect(() => {
    if (!token?.address || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawEstimate(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const estimate = await handlePreviewWithdraw()
        setWithdrawEstimate(estimate)
      } catch (error) {
        setWithdrawEstimate(null)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [token?.address, withdrawAmount, handlePreviewWithdraw])

  const formattedShares = parseFloat(formatUnits(BigInt(shares || '0'), denominatorDecimals))
  const insufficientShares = parseFloat(withdrawAmount) > formattedShares

  const usdValue = useMemo(() => {
    if (!withdrawAmount || !vault.pricePerShareUsd) return 0

    const amount = parseFloat(withdrawAmount) || 0
    const pricePerShare = parseFloat(vault.pricePerShareUsd) || 0

    return amount * pricePerShare
  }, [withdrawAmount, vault.pricePerShareUsd])

  const handleSlippageChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setSlippage(value)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected && openConnectModal) {
      openConnectModal()
      return
    }
    if (!isConnected) return
    await onWithdraw()
  }

  const isConnected = !!address

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-between w-full items-center relative">
          <WalletBalance
            balance={formattedShares}
            tokenSymbol={vault.metadata?.symbol || vault.name}
            label="Your shares:"
          />
          <div ref={settingsRef}>
            <Button
              onClick={() => setShowSlippageSettings(!showSlippageSettings)}
              variant="ghost"
              size="sm"
              className="rounded-full"
            >
              <Settings size={20} className="text-gray-500" />
            </Button>

            {showSlippageSettings && (
              <div className="absolute right-0 top-8 z-10 w-64 p-4 bg-white dark:bg-[#1B1E20] rounded-lg shadow-lg border border-accent border-solid">
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-foreground">Slippage Tolerance</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['0.5', '1.0', '1.5'].map((value) => (
                      <Button
                        variant={slippage === value ? 'default' : 'outline'}
                        size="sm"
                        key={value}
                        onClick={() => setSlippage(value)}
                        className="rounded-lg"
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="text"
                      value={slippage}
                      onChange={(e) => handleSlippageChange(e.target.value)}
                      className="w-full text-right bg-white dark:bg-[#1B1E20] border border-gray-200 dark:border-gray-700"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {shares && shares !== '0' && (
          <span className="text-[10px] text-muted-foreground font-mono ml-0">
            {formatUnits(BigInt(shares), 18)}
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-5 w-full bg-white dark:bg-[#1B1E20] border border-gray-200 dark:border-gray-700 ring-0 outline-none text-foreground px-2 rounded-lg">
          <Input
            id="withdrawAmount"
            type="number"
            placeholder="Enter withdraw amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="flex items-center gap-5 w-full bg-white dark:bg-[#1B1E20] !border-0 ring-0 outline-none text-foreground"
          />
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            ${formatUsdCompact(usdValue)}
          </p>
        </div>

        <PercentageSelector
          onPercentageChange={(percentage) => {
            setWithdrawAmount((formattedShares * (percentage / 100)).toFixed(18))
          }}
        />
      </div>

      <div className="w-full flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Withdraw as:</p>
        {availableTokens && availableTokens.length > 0 ? (
          <Select
            value={token?.address}
            onValueChange={(value) => {
              const selectedToken = availableTokens.find((t) => t.address === value)
              setToken(selectedToken)
            }}
          >
            <SelectTrigger className="glass w-full">
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
            <span className="text-gray-500">Loading withdrawal assets...</span>
          </div>
        )}
      </div>

      {withdrawEstimate && (
        <ActionPreview
          title="Withdraw Preview"
          receivedShares={Number(
            formatUnits(
              BigInt(withdrawEstimate?.assetAmountBN || '0'),
              token?.decimals || 18
            )
          )}
          tokenSymbol={token?.symbol || ''}
        />
      )}

      <Button
        className="w-full h-10 rounded-full bg-accent"
        disabled={
          isWaitingForWithdraw ||
          !withdrawAmount ||
          parseFloat(withdrawAmount) <= 0 ||
          insufficientShares
        }
        onClick={handleWithdraw}
      >
        {isWaitingForWithdraw ? <Loader2 className="animate-spin" size={16} /> : 'Withdraw'}
      </Button>

      {insufficientShares && (
        <p className="text-sm text-red-500">Insufficient shares for withdraw</p>
      )}
    </div>
  )
}

