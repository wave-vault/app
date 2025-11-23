import { Address } from 'viem'

const SUBGRAPH_URL = "https://api.goldsky.com/api/public/project_cmgzitcts001c5np28moc9lyy/subgraphs/onewave/backend-0.0.6/gn"

export interface AquaPairData {
  token0: Address
  token1: Address
  feeBps: string
  vault: Address
  pairHash: string
  id?: string
  txid?: string
}

export interface AquaPairWithTvl extends AquaPairData {
  tvlUsd?: string
  vaultName?: string
}

export interface XYCSwapStrategy {
  maker: Address
  token0: Address
  token1: Address
  feeBps: bigint
  salt: `0x${string}`
}

/**
 * Query subgraph for all Aqua pairs matching the two tokens
 */
export async function getAllPairsFromSubgraph(
  token0: Address,
  token1: Address,
): Promise<AquaPairData[]> {
  const query = `
    {
      aquaPairs(first: 1000, orderBy: id, orderDirection: asc) {
        id
        txid
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
      const matchingPairs = data.data.aquaPairs.filter(
        (p: any) =>
          (p.token0.toLowerCase() === token0.toLowerCase() &&
            p.token1.toLowerCase() === token1.toLowerCase()) ||
          (p.token0.toLowerCase() === token1.toLowerCase() &&
            p.token1.toLowerCase() === token0.toLowerCase()),
      )

      return matchingPairs.map((pair: any) => ({
        id: pair.id,
        txid: pair.txid,
        token0: pair.token0 as Address,
        token1: pair.token1 as Address,
        feeBps: pair.feeBps,
        vault: pair.vault as Address,
        pairHash: pair.pairHash,
      }))
    }

    return []
  } catch (error) {
    throw error
  }
}

/**
 * Query subgraph for Aqua pair data (returns first matching pair for backward compatibility)
 */
export async function getPairFromSubgraph(
  token0: Address,
  token1: Address,
): Promise<AquaPairData | null> {
  const pairs = await getAllPairsFromSubgraph(token0, token1)
  return pairs.length > 0 ? pairs[0] : null
}

/**
 * Get TVL for a vault from Stats API
 */
async function getVaultTvl(vaultAddress: Address): Promise<string | undefined> {
  try {
    const STATS_API_BASE_URL = import.meta.env.VITE_STATS_API_BASE_URL || ''
    if (!STATS_API_BASE_URL) {
      return undefined
    }

    const response = await fetch(`${STATS_API_BASE_URL}/strategies/${vaultAddress.toLowerCase()}`)
    if (!response.ok) {
      return undefined
    }

    const data = await response.json()
    return data.metrics?.tvlUsd || data.value_usd || undefined
  } catch (error) {
    return undefined
  }
}

/**
 * Get all pairs with TVL data and select the best one (highest TVL)
 */
export async function getBestPairWithTvl(
  token0: Address,
  token1: Address,
): Promise<AquaPairWithTvl | null> {
  const pairs = await getAllPairsFromSubgraph(token0, token1)
  
  if (pairs.length === 0) {
    return null
  }

  // Fetch TVL for all vaults in parallel
  const pairsWithTvl = await Promise.all(
    pairs.map(async (pair) => {
      const tvlUsd = await getVaultTvl(pair.vault)
      return {
        ...pair,
        tvlUsd,
      }
    })
  )

  // Sort by TVL (highest first), then select the first one
  pairsWithTvl.sort((a, b) => {
    const tvlA = a.tvlUsd ? parseFloat(a.tvlUsd) : 0
    const tvlB = b.tvlUsd ? parseFloat(b.tvlUsd) : 0
    return tvlB - tvlA
  })

  return pairsWithTvl[0] || null
}

/**
 * Get all pairs with TVL data for selection
 */
export async function getAllPairsWithTvl(
  token0: Address,
  token1: Address,
): Promise<AquaPairWithTvl[]> {
  const pairs = await getAllPairsFromSubgraph(token0, token1)
  
  if (pairs.length === 0) {
    return []
  }

  // Fetch TVL for all vaults in parallel
  const pairsWithTvl = await Promise.all(
    pairs.map(async (pair) => {
      const tvlUsd = await getVaultTvl(pair.vault)
      return {
        ...pair,
        tvlUsd,
      }
    })
  )

  // Sort by TVL (highest first)
  pairsWithTvl.sort((a, b) => {
    const tvlA = a.tvlUsd ? parseFloat(a.tvlUsd) : 0
    const tvlB = b.tvlUsd ? parseFloat(b.tvlUsd) : 0
    return tvlB - tvlA
  })

  return pairsWithTvl
}

/**
 * Determine swap direction (zeroForOne)
 * true = token0 -> token1, false = token1 -> token0
 */
export function determineZeroForOne(
  pairToken0: Address,
  _pairToken1: Address,
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

