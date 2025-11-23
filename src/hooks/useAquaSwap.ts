import { useState } from 'react'
import { Address, createPublicClient, http, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { useWriteContract, useReadContract } from 'wagmi'
import { erc20ABI } from '@factordao/contracts'
import { XYC_SWAP_ADDRESS } from '@/lib/constants/swap'
import { getBaseRpcUrl } from '@/lib/constants/rpc'
import xycswapABI from '@/lib/abis/xycswap.json'
import type { XYCSwapStrategy } from '@/lib/utils/swap'

interface UseAquaSwapParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: string
  tokenInDecimals: number
  tokenOutDecimals: number
  slippageBps: bigint
  recipient: Address
  xycStrategy: XYCSwapStrategy | null
  zeroForOne: boolean
  quote: bigint | undefined
  onSuccess?: () => void
}

export function useAquaSwap({
  tokenIn,
  amountIn,
  tokenInDecimals,
  slippageBps,
  recipient,
  xycStrategy,
  zeroForOne,
  quote,
  onSuccess,
}: UseAquaSwapParams) {
  const [isLoading, setIsLoading] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const [steps, setSteps] = useState({
    approve: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    swap: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  })

  // Parse amountIn to BigInt
  const amountInBN = amountIn && !isNaN(parseFloat(amountIn)) && parseFloat(amountIn) > 0
    ? parseUnits(amountIn, tokenInDecimals)
    : 0n

  // Calculate minimum output
  const amountOutMin = quote && quote > 0n
    ? (quote * (10000n - slippageBps)) / 10000n
    : 0n

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [recipient, XYC_SWAP_ADDRESS],
    query: {
      enabled: !!tokenIn && !!recipient && amountInBN > 0n,
    },
  })

  const needsApproval = currentAllowance && amountInBN > 0n
    ? (currentAllowance as bigint) < amountInBN
    : false

  const handleSwap = async () => {
    if (!xycStrategy || !quote || amountInBN === 0n || amountOutMin === 0n) {
      const error = new Error('Invalid swap parameters')
      throw error
    }

    if (!recipient) {
      throw new Error('Recipient address is required')
    }

    setIsLoading(true)

    try {
      // Re-check allowance dynamically
      const publicClient = createPublicClient({
        chain: base,
        transport: http(getBaseRpcUrl()),
      })

      const currentAllowanceCheck = await publicClient.readContract({
        address: tokenIn,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [recipient, XYC_SWAP_ADDRESS],
      })

      const needsApprovalCheck = (currentAllowanceCheck as bigint) < amountInBN

      // Step 1: Approve if needed
      if (needsApprovalCheck) {
        setSteps({ approve: 'loading', swap: 'idle' })

        // Approve exact amount from input
        const approveAmount = amountInBN

        const approveHash = await writeContractAsync({
          address: tokenIn,
          abi: erc20ABI,
          functionName: 'approve',
          chain: base,
          account: recipient,
          args: [XYC_SWAP_ADDRESS, approveAmount],
        })

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        setSteps({ approve: 'success', swap: 'idle' })
        refetchAllowance()
      } else {
        setSteps({ approve: 'success', swap: 'idle' })
      }

      // Step 2: Execute swap
      setSteps((prev) => ({ ...prev, swap: 'loading' }))

      const swapHash = await writeContractAsync({
        address: XYC_SWAP_ADDRESS,
        abi: xycswapABI,
        functionName: 'swapExactIn',
        chain: base,
        account: recipient,
        args: [xycStrategy, zeroForOne, amountInBN, amountOutMin, recipient, '0x' as `0x${string}`],
      })

      // Wait for swap confirmation (reuse publicClient from above)

      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash })

      if (receipt.status !== 'success') {
        throw new Error('Swap transaction failed')
      }

      setSteps({ approve: 'success', swap: 'success' })
      onSuccess?.()
    } catch (error: any) {
      setSteps((prev) => ({
        approve: prev.approve === 'loading' ? 'error' : prev.approve,
        swap: prev.swap === 'loading' ? 'error' : prev.swap,
      }))
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleSwap,
    isLoading,
    steps,
    needsApproval,
    amountOutMin,
    currentAllowance: currentAllowance as bigint | undefined,
  }
}

