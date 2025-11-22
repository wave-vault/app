import { useState, useEffect } from 'react'
import { Address } from 'viem'
import { useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { XYC_SWAP_ADDRESS } from '@/lib/constants/swap'
import { getPairFromSubgraph, determineZeroForOne, type XYCSwapStrategy } from '@/lib/utils/swap'
import { aquaAdapterABI } from '@factordao/contracts'
import xycswapABI from '@/lib/abis/xycswap.json'

interface UseSwapQuoteParams {
  tokenIn: Address | null
  tokenOut: Address | null
  amountIn: string
  tokenInDecimals?: number
}

export function useSwapQuote({
  tokenIn,
  tokenOut,
  amountIn,
  tokenInDecimals = 18,
}: UseSwapQuoteParams) {
  const [pairData, setPairData] = useState<{
    vault: Address
    pairHash: string
    token0: Address
    token1: Address
    feeBps: string
  } | null>(null)
  const [strategyNonce, setStrategyNonce] = useState<bigint | null>(null)
  const [isLoadingPair, setIsLoadingPair] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)

  // Fetch pair data from subgraph
  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setPairData(null)
      setPairError(null)
      return
    }

    setIsLoadingPair(true)
    setPairError(null)

    getPairFromSubgraph(tokenIn, tokenOut)
      .then((pair) => {
        if (!pair) {
          setPairError('Pair not found in subgraph')
          setPairData(null)
          return
        }
        setPairData(pair)
      })
      .catch((error) => {
        console.error('[useSwapQuote] Error fetching pair:', error)
        setPairError(error.message || 'Failed to fetch pair')
        setPairData(null)
      })
      .finally(() => {
        setIsLoadingPair(false)
      })
  }, [tokenIn, tokenOut])

  // Read strategy nonce from vault
  const { data: nonceData } = useReadContract({
    address: pairData?.vault,
    abi: aquaAdapterABI,
    functionName: 'strategyNonces',
    args: pairData?.pairHash ? [pairData.pairHash as `0x${string}`] : undefined,
    query: {
      enabled: !!pairData?.pairHash && !!pairData?.vault,
    },
  })

  useEffect(() => {
    if (nonceData) {
      setStrategyNonce(nonceData as bigint)
    }
  }, [nonceData])

  // Build XYCSwap strategy struct
  const xycStrategy: XYCSwapStrategy | null = pairData && strategyNonce !== null
    ? {
        maker: pairData.vault,
        token0: pairData.token0,
        token1: pairData.token1,
        feeBps: BigInt(pairData.feeBps),
        salt: `0x${strategyNonce.toString(16).padStart(64, '0')}` as `0x${string}`,
      }
    : null

  // Determine zeroForOne
  const zeroForOne = pairData && tokenIn
    ? determineZeroForOne(pairData.token0, pairData.token1, tokenIn)
    : false

  // Parse amountIn to BigInt
  const amountInBN = amountIn && !isNaN(parseFloat(amountIn)) && parseFloat(amountIn) > 0
    ? parseUnits(amountIn, tokenInDecimals)
    : 0n

  // Read quote from XYCSwap
  const { data: quote, isLoading: isLoadingQuote, error: quoteError } = useReadContract({
    address: XYC_SWAP_ADDRESS,
    abi: xycswapABI,
    functionName: 'quoteExactIn',
    args: xycStrategy && amountInBN > 0n
      ? [xycStrategy, zeroForOne, amountInBN]
      : undefined,
    query: {
      enabled: !!xycStrategy && amountInBN > 0n,
    },
  })

  return {
    quote: quote as bigint | undefined,
    isLoading: isLoadingPair || isLoadingQuote,
    error: pairError || (quoteError?.message || null),
    pairData,
    xycStrategy,
    zeroForOne,
  }
}

