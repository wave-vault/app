import { useState } from 'react'
import { ChainId, valueToBigNumber } from '@factordao/sdk'
import { StudioProVault } from '@factordao/sdk-studio'
import { StrategyBuilder } from '@factordao/sdk-studio'
import BigNumber from 'bignumber.js'
import { Address, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { useSendTransaction } from 'wagmi'
import { environment } from '@/lib/constants/dev'
import { BASE_CHAIN_ID, getBaseRpcUrl } from '@/lib/constants/rpc'

interface UseProVaultWithdrawParams {
  vaultAddress: Address
  tokenAddress: Address
  withdrawAmount: string
  depositorAddress: Address
  receiverAddress: Address
  onSuccess?: () => void
  slippageTolerance: string
  withdrawAmountRaw?: string
}

export function useProVaultWithdraw({
  vaultAddress,
  tokenAddress,
  withdrawAmount,
  depositorAddress,
  receiverAddress,
  onSuccess,
  slippageTolerance: _slippageTolerance,
  withdrawAmountRaw,
}: UseProVaultWithdrawParams) {
  const [isWaitingForWithdraw, setIsWaitingForWithdraw] = useState(false)
  const { sendTransactionAsync } = useSendTransaction()

  const handleWithdraw = async () => {
    try {
      setIsWaitingForWithdraw(true)
      const proVault = new StudioProVault({
        chainId: BASE_CHAIN_ID,
        vaultAddress,
        environment: environment,
        jsonRpcUrl: getBaseRpcUrl(),
      })
      const publicClient = createPublicClient({
        chain: base,
        transport: http(getBaseRpcUrl()),
      })
      // For rawWithdraw, we need shares in raw format (BigInt), not formatted amount
      // withdrawAmount is already in shares format (e.g. "5.5" shares)
      // Shares always have 18 decimals, regardless of denominator token decimals
      let sharesRaw: bigint

      if (withdrawAmountRaw) {
        // If raw shares are provided, use them directly (already in raw format)
        sharesRaw = BigInt(withdrawAmountRaw)
      } else {
        // Convert formatted shares (e.g. "5.5") to raw shares (BigInt)
        // Shares always use 18 decimals (like balanceOf returns)
        sharesRaw = BigInt(
          BigNumber(withdrawAmount)
            .multipliedBy(BigNumber(10).pow(18)) // Shares always 18 decimals
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
      }

      // Use rawWithdraw with publishPairs strategy (as per 16-raw-withdraw.ts)
      // This ensures liquidity is updated on Aqua Protocol after withdrawal
      let withdrawData: any

      try {
        // Estimate raw withdraw to get available assets
        // Pass shares raw directly (BigInt), not converted string
        const result = await proVault.estimateRawWithdrawExpectedAmount(sharesRaw)
        // result[0] = shares
        // result[1] = totalSupply
        // result[2] = assets (address[])
        // result[3] = assetAmounts
        // result[4] = debts
        // result[5] = debtAmounts

        const assets = result[2] as Address[]
        
        // Build isWithdraw array: true for the selected token, false for others
        const isWithdraw: boolean[] = []
        for (const asset of assets) {
          // Withdraw the selected token, skip others
          const shouldWithdraw = asset.toLowerCase() === tokenAddress.toLowerCase()
          isWithdraw.push(shouldWithdraw)
        }

        // Build withdraw strategy: publishPairs() to update Aqua liquidity
        const sbEncoder = new StrategyBuilder({
          chainId: ChainId.BASE,
          isProAdapter: true,
          environment: environment,
        })
        
        // Add publishPairs to update liquidity after withdrawal
        sbEncoder.adapter.aqua.publishPairs()
        const withdrawBlocks = sbEncoder.getTransactions()

        // Execute rawWithdraw with publishPairs strategy
        // shareAmountBN must be the raw shares (BigNumber), not formatted amount
        withdrawData = await proVault.rawWithdraw({
          shareAmountBN: valueToBigNumber(sharesRaw.toString()),
          receiverAddress,
          depositorAddress,
          withdrawBlocks, // publishPairs() will be executed after withdrawal
          isWithdraw, // Only withdraw the selected token
        })
      } catch (error) {
        setIsWaitingForWithdraw(false)
        throw error
      }

      if (!withdrawData) {
        setIsWaitingForWithdraw(false)
        return
      }

      const hash = await sendTransactionAsync(withdrawData)
      const withdrawReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      })
      if (!withdrawReceipt) {
        throw new Error('Withdraw transaction failed')
      }
      setIsWaitingForWithdraw(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setIsWaitingForWithdraw(false)
      throw error
    }
  }

  return {
    handleWithdraw,
    isWaitingForWithdraw,
  }
}

