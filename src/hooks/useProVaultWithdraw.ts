import { useState } from 'react'
import { studioProV1ABI } from '@factordao/contracts'
import { ChainId, valueToBigInt, valueToBigNumber } from '@factordao/sdk'
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
      const denominator = await publicClient.readContract({
        address: vaultAddress,
        abi: studioProV1ABI,
        functionName: 'getDenominator',
        args: [],
      })

      // Determine tokenAmount: use raw if provided, otherwise calculate from withdrawAmount
      let tokenAmount: string

      if (withdrawAmountRaw) {
        tokenAmount = withdrawAmountRaw
      } else {
        let denominatorDecimals = 18
        try {
          const decimalsResult = await publicClient.readContract({
            address: denominator as Address,
            abi: [
              {
                name: 'decimals',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ name: '', type: 'uint8' }],
              },
            ],
            functionName: 'decimals',
            args: [],
          })
          denominatorDecimals = Number(decimalsResult)
        } catch (error) {
          denominatorDecimals = 18
        }

        tokenAmount = BigNumber(withdrawAmount)
          .multipliedBy(BigNumber(10).pow(denominatorDecimals))
          .integerValue(BigNumber.ROUND_DOWN)
          .toString()
      }
      // Use rawWithdraw with publishPairs strategy (as per 16-raw-withdraw.ts)
      // This ensures liquidity is updated on Aqua Protocol after withdrawal
      let withdrawData: any

      try {
        // Estimate raw withdraw to get available assets
        const result = await proVault.estimateRawWithdrawExpectedAmount(valueToBigInt(tokenAmount))
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
        withdrawData = await proVault.rawWithdraw({
          shareAmountBN: valueToBigNumber(tokenAmount),
          receiverAddress,
          depositorAddress,
          withdrawBlocks, // publishPairs() will be executed after withdrawal
          isWithdraw, // Only withdraw the selected token
        })
      } catch (error) {
        console.error('[useProVaultWithdraw] Error preparing raw withdraw:', error)
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

