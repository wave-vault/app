import { useState, useEffect } from 'react'
import { Address } from 'viem'
import { useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { XYC_SWAP_ADDRESS } from '@/lib/constants/swap'
import { getAllPairsWithTvl, determineZeroForOne, type XYCSwapStrategy, type AquaPairWithTvl } from '@/lib/utils/swap'
import { aquaAdapterABI } from '@factordao/contracts'
import xycswapABI from '@/lib/abis/xycswap.json'

interface UseSwapQuoteParams {
  tokenIn: Address | null
  tokenOut: Address | null
  amountIn: string
  tokenInDecimals?: number
  selectedPairHash?: string | null // Optional: specific pair to use
}

export function useSwapQuote({
  tokenIn,
  tokenOut,
  amountIn,
  tokenInDecimals = 18,
  selectedPairHash,
}: UseSwapQuoteParams) {
  const [pairData, setPairData] = useState<{
    vault: Address
    pairHash: string
    token0: Address
    token1: Address
    feeBps: string
  } | null>(null)
  const [availablePairs, setAvailablePairs] = useState<AquaPairWithTvl[]>([])
  const [strategyNonce, setStrategyNonce] = useState<bigint | null>(null)
  const [isLoadingPair, setIsLoadingPair] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)

  // Fetch all pairs with TVL from subgraph
  useEffect(() => {
    if (!tokenIn || !tokenOut) {
      setPairData(null)
      setAvailablePairs([])
      setPairError(null)
      return
    }

    setIsLoadingPair(true)
    setPairError(null)

    getAllPairsWithTvl(tokenIn, tokenOut)
      .then((pairs) => {
        if (pairs.length === 0) {
          setPairError('No pairs found in subgraph')
          setPairData(null)
          setAvailablePairs([])
          return
        }

        setAvailablePairs(pairs)

        // Select pair: use selectedPairHash if provided, otherwise use best (first, highest TVL)
        let selectedPair: AquaPairWithTvl | null = null
        if (selectedPairHash) {
          selectedPair = pairs.find(p => p.pairHash.toLowerCase() === selectedPairHash.toLowerCase()) || null
        }
        if (!selectedPair) {
          selectedPair = pairs[0] // Best pair (highest TVL)
        }

        if (selectedPair) {
          setPairData({
            vault: selectedPair.vault,
            pairHash: selectedPair.pairHash,
            token0: selectedPair.token0,
            token1: selectedPair.token1,
            feeBps: selectedPair.feeBps,
          })
        } else {
          setPairError('No valid pair selected')
          setPairData(null)
        }
      })
      .catch((error) => {
        setPairError(error.message || 'Failed to fetch pairs')
        setPairData(null)
        setAvailablePairs([])
      })
      .finally(() => {
        setIsLoadingPair(false)
      })
  }, [tokenIn, tokenOut, selectedPairHash])

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

  // Check for insufficient liquidity
  const liquidityError = (() => {
    // If we have an amount but no quote (or quote is 0), it means insufficient liquidity
    if (amountInBN > 0n && xycStrategy && !isLoadingQuote) {
      if (!quote || quote === 0n) {
        return 'Insufficient liquidity for this swap. The vault does not have enough available liquidity (required: half of TVL).'
      }
    }
    return null
  })()

  return {
    quote: quote as bigint | undefined,
    isLoading: isLoadingPair || isLoadingQuote,
    error: pairError || liquidityError || (quoteError?.message || null),
    pairData,
    availablePairs, // All available pairs with TVL
    xycStrategy,
    zeroForOne,
  }
}
