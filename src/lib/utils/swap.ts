import { Address } from 'viem'
import { SUBGRAPH_URL } from '../constants/swap'

export interface AquaPairData {
  token0: Address
  token1: Address
  feeBps: string
  vault: Address
  pairHash: string
}

export interface XYCSwapStrategy {
  maker: Address
  token0: Address
  token1: Address
  feeBps: bigint
  salt: `0x${string}`
}

/**
 * Query subgraph for Aqua pair data
 */
export async function getPairFromSubgraph(
  token0: Address,
  token1: Address,
): Promise<AquaPairData | null> {
  const query = `
    {
      aquaPairs {
        id
        token0
        token1
        feeBps
        vault
        pairHash
      }
    }
  `

  try {
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
    }

    if (data.data?.aquaPairs) {
      // Filter pairs by token addresses (check both orders)
      const pair = data.data.aquaPairs.find(
        (p: any) =>
          (p.token0.toLowerCase() === token0.toLowerCase() &&
            p.token1.toLowerCase() === token1.toLowerCase()) ||
          (p.token0.toLowerCase() === token1.toLowerCase() &&
            p.token1.toLowerCase() === token0.toLowerCase()),
      )

      if (!pair) return null

      return {
        token0: pair.token0 as Address,
        token1: pair.token1 as Address,
        feeBps: pair.feeBps,
        vault: pair.vault as Address,
        pairHash: pair.pairHash,
      }
    }

    return null
  } catch (error) {
    console.error('[getPairFromSubgraph] Error:', error)
    throw error
  }
}

/**
 * Determine swap direction (zeroForOne)
 * true = token0 -> token1, false = token1 -> token0
 */
export function determineZeroForOne(
  pairToken0: Address,
  pairToken1: Address,
  tokenIn: Address,
): boolean {
  // If tokenIn matches pairToken0, then zeroForOne = true
  return pairToken0.toLowerCase() === tokenIn.toLowerCase()
}

/**
 * Calculate minimum output amount with slippage
 * amountOutMin = quote * (10000 - slippageBps) / 10000
 */
export function calculateMinOutput(
  quote: bigint,
  slippageBps: bigint,
): bigint {
  return (quote * (10000n - slippageBps)) / 10000n
}

