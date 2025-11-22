/**
 * Vault Service - Aggregates data from multiple Factor Studio Stats API endpoints
 */

const STATS_API_BASE_URL = import.meta.env.VITE_STATS_API_BASE_URL || ""
const VAULT_NAME_PREFIX = "ethGlobal - wave: "

// ==================== Type Definitions ====================

export interface VaultToken {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUrl?: string
}

export interface VaultPerformance {
  prevPricePerShare?: string
  pnl?: string
}

export interface VaultAPY {
  total_idle_usd?: number
  total_debt_usd?: number
  total_credit_usd?: number
  weighted_apy_credit?: number
  weighted_apy_debt?: number
  credit_return?: number
  debt_interests?: number
  net_return?: number
  calculated_apy?: number
}

export interface VaultDeposit {
  chainId: number
  balance: string
  balance_fmt?: number
  value_usd?: number
  reward_apy?: number
  apy?: number
  apr?: number
  type?: string
  protocol?: string
  metadata?: {
    symbol: string
    name: string
    decimals: number
    address: string
    underlying?: string
  }
}

export interface AggregatedVault {
  // Basic info
  address: string
  name: string
  chainId: number
  description?: string
  
  // Metrics
  tvlUsd?: string
  pricePerShare?: string
  pricePerShareUsd?: string
  
  // Performance
  performance24h?: VaultPerformance
  performance7d?: VaultPerformance
  performance30d?: VaultPerformance
  performance90d?: VaultPerformance
  
  // APY
  apy?: number
  apyBoost?: string
  apyVote?: string
  
  // Tokens
  tokens?: VaultToken[]
  depositTokens?: VaultToken[]
  withdrawTokens?: VaultToken[]
  
  // Additional data
  protocols?: string[]
  depositStrategy?: any[]
  balances?: Record<string, any>
  
  // Fees
  depositFee?: string
  withdrawFee?: string
  managementFee?: string
  performanceFee?: string
  
  // Vault analytics
  vaultAnalytics?: {
    apy?: VaultAPY
    deposits?: Record<string, VaultDeposit>
    fetchedAt?: number
  }
}

interface ProVaultResponse {
  user?: string
  address: string
  vault_address?: string
  position_address?: string
  name: string
  description?: string
  chain: string | number
  chainId?: string | number
  tvlUsd?: string
  pricePerShare?: string
  pricePerShareUsd?: string
  apyBoost?: string
  apyVote?: string
  performance24h?: VaultPerformance
  performance7d?: VaultPerformance
  performance30d?: VaultPerformance
  performance90d?: VaultPerformance
  apy?: VaultAPY | number
  protocols?: string[]
  depositStrategy?: any[]
  balances?: Record<string, any>
  depositFee?: string
  withdrawFee?: string
  managementFee?: string
  performanceFee?: string
  vaultAnalytics?: {
    apy?: VaultAPY
    deposits?: Record<string, VaultDeposit>
    fetchedAt?: number
  }
  assets?: string[]
  depositAssetAddressesVisibility?: string[]
  withdrawAssetAddressesVisibility?: string[]
}

interface AvailableTokenResponse {
  token: {
    address?: string
    symbol: string
    name: string
    decimals: number
    logoUrl?: string
  }
  chain: number
  strategies: Array<{
    vault_address: string
    name: string
    description?: string
    tvlUsd?: string
    pricePerShare?: string
    apyBoost?: string
    apyVote?: string
    performance24h?: VaultPerformance
    performance7d?: VaultPerformance
    performance30d?: VaultPerformance
    performance90d?: VaultPerformance
    apy?: VaultAPY | number
  }>
}

// Create a map of token addresses to token info from available-tokens
function createTokenInfoMap(availableTokens: AvailableTokenResponse[]): Map<string, VaultToken> {
  const tokenMap = new Map<string, VaultToken>()
  
  availableTokens.forEach((tokenData) => {
    if (tokenData.token.address) {
      const addressLower = tokenData.token.address.toLowerCase()
      tokenMap.set(addressLower, {
        symbol: tokenData.token.symbol,
        name: tokenData.token.name,
        address: tokenData.token.address,
        decimals: tokenData.token.decimals,
        logoUrl: tokenData.token.logoUrl,
      })
    }
  })
  
  return tokenMap
}

// ==================== API Functions ====================

async function fetchProVaults(): Promise<ProVaultResponse[]> {
  if (!STATS_API_BASE_URL) {
    console.warn("VITE_STATS_API_BASE_URL not set")
    return []
  }

  try {
    const response = await fetch(`${STATS_API_BASE_URL}/utils/pro-vaults/`)
    if (!response.ok) {
      throw new Error(`Failed to fetch pro vaults: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching pro vaults:", error)
    return []
  }
}

async function fetchAvailableTokens(): Promise<AvailableTokenResponse[]> {
  if (!STATS_API_BASE_URL) {
    console.warn("VITE_STATS_API_BASE_URL not set")
    return []
  }

  try {
    const response = await fetch(`${STATS_API_BASE_URL}/utils/available-tokens/`)
    if (!response.ok) {
      throw new Error(`Failed to fetch available tokens: ${response.statusText}`)
    }
    const data = await response.json()
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('[vaultService] available-tokens API did not return an array:', typeof data, data)
      return []
    }
    return data
  } catch (error) {
    console.error("Error fetching available tokens:", error)
    return []
  }
}

async function fetchStrategies(): Promise<any[]> {
  if (!STATS_API_BASE_URL) {
    console.warn("VITE_STATS_API_BASE_URL not set")
    return []
  }

  try {
    const response = await fetch(`${STATS_API_BASE_URL}/strategies`)
    if (!response.ok) {
      throw new Error(`Failed to fetch strategies: ${response.statusText}`)
    }
    const result = await response.json()
    return result?.data || []
  } catch (error) {
    console.error("Error fetching strategies:", error)
    return []
  }
}

// ==================== Aggregation Functions ====================

function extractTokensFromDeposits(deposits?: Record<string, VaultDeposit>): VaultToken[] {
  if (!deposits) return []
  
  const tokens: VaultToken[] = []
  const seenAddresses = new Set<string>()
  
  Object.values(deposits).forEach((deposit) => {
    if (deposit.metadata?.address && !seenAddresses.has(deposit.metadata.address.toLowerCase())) {
      seenAddresses.add(deposit.metadata.address.toLowerCase())
      tokens.push({
        symbol: deposit.metadata.symbol || "Unknown",
        name: deposit.metadata.name || "Unknown",
        address: deposit.metadata.address,
        decimals: deposit.metadata.decimals || 18,
      })
    }
  })
  
  return tokens
}

function extractAPY(apy?: VaultAPY | number): number | undefined {
  if (typeof apy === "number") return apy
  if (apy?.calculated_apy !== undefined) return apy.calculated_apy
  return undefined
}

// BASE chain ID constant
const BASE_CHAIN_ID = 8453

function normalizeChainId(chain: string | number | undefined): number {
  // Always return BASE chain ID
  return BASE_CHAIN_ID
}

function normalizeVaultAddress(vault: ProVaultResponse): string {
  return vault.vault_address || vault.address || vault.position_address || ""
}

/**
 * Aggregates vault data from all available API endpoints
 */
export async function fetchAggregatedVaults(): Promise<AggregatedVault[]> {
  const [proVaults, availableTokens, strategies] = await Promise.all([
    fetchProVaults(),
    fetchAvailableTokens(),
    fetchStrategies(),
  ])

  console.log('[vaultService] Fetched data:', {
    proVaults: proVaults?.length || 0,
    availableTokens: availableTokens?.length || 0,
    strategies: strategies?.length || 0,
    availableTokensType: typeof availableTokens,
    availableTokensIsArray: Array.isArray(availableTokens),
  })

  // Ensure availableTokens is an array
  const safeAvailableTokens = Array.isArray(availableTokens) ? availableTokens : []

  // Create token info map from available-tokens for quick lookup
  const tokenInfoMap = createTokenInfoMap(safeAvailableTokens)

  // Create a map of vaults by address for quick lookup
  const vaultMap = new Map<string, AggregatedVault>()

  // Process pro vaults (primary source)
  const filteredProVaults = proVaults.filter((vault) => vault.name?.startsWith(VAULT_NAME_PREFIX))
  console.log('[vaultService] Pro vaults filtered by prefix:', {
    total: proVaults.length,
    filtered: filteredProVaults.length,
    prefix: VAULT_NAME_PREFIX,
    sampleNames: proVaults.slice(0, 3).map(v => v.name),
  })

  filteredProVaults.forEach((vault) => {
      const address = normalizeVaultAddress(vault)
      if (!address) return

      const chainId = normalizeChainId(vault.chainId || vault.chain)
      
      // Extract tokens from multiple sources (priority order):
      // 1. depositAssetAddressesVisibility (preferred - these are the deposit tokens)
      // 2. assets array
      // 3. vaultAnalytics.deposits
      const tokens: VaultToken[] = []
      const seenAddresses = new Set<string>()
      
      // Priority 1: depositAssetAddressesVisibility
      if (vault.depositAssetAddressesVisibility && vault.depositAssetAddressesVisibility.length > 0) {
        vault.depositAssetAddressesVisibility.forEach((addr) => {
          const addrLower = addr.toLowerCase()
          if (!seenAddresses.has(addrLower)) {
            seenAddresses.add(addrLower)
            const tokenInfo = tokenInfoMap.get(addrLower)
            if (tokenInfo) {
              tokens.push(tokenInfo)
            } else {
              // Fallback: create token from address only
              tokens.push({
                symbol: "",
                name: "",
                address: addr,
                decimals: 18,
              })
            }
          }
        })
      }
      
      // Priority 2: assets array
      if (vault.assets && vault.assets.length > 0) {
        vault.assets.forEach((addr) => {
          const addrLower = addr.toLowerCase()
          if (!seenAddresses.has(addrLower)) {
            seenAddresses.add(addrLower)
            const tokenInfo = tokenInfoMap.get(addrLower)
            if (tokenInfo) {
              tokens.push(tokenInfo)
            } else {
              tokens.push({
                symbol: "",
                name: "",
                address: addr,
                decimals: 18,
              })
            }
          }
        })
      }
      
      // Priority 3: vaultAnalytics.deposits (fallback)
      if (tokens.length === 0) {
        const depositTokens = extractTokensFromDeposits(vault.vaultAnalytics?.deposits)
        depositTokens.forEach((token) => {
          const addrLower = token.address.toLowerCase()
          if (!seenAddresses.has(addrLower)) {
            seenAddresses.add(addrLower)
            // Try to enrich with tokenInfoMap
            const tokenInfo = tokenInfoMap.get(addrLower)
            if (tokenInfo) {
              tokens.push({
                ...token,
                logoUrl: tokenInfo.logoUrl || token.logoUrl,
                symbol: tokenInfo.symbol || token.symbol,
                name: tokenInfo.name || token.name,
              })
            } else {
              tokens.push(token)
            }
          }
        })
      }
      
      // Enrich all tokens with logos from tokenInfoMap if missing
      tokens.forEach((token) => {
        if (!token.logoUrl) {
          const tokenInfo = tokenInfoMap.get(token.address.toLowerCase())
          if (tokenInfo) {
            token.logoUrl = tokenInfo.logoUrl
            if (!token.symbol) token.symbol = tokenInfo.symbol
            if (!token.name) token.name = tokenInfo.name
          }
        }
      })
      
      // Extract APY
      const apy = extractAPY(vault.apy || vault.vaultAnalytics?.apy)

      vaultMap.set(address.toLowerCase(), {
        address,
        name: vault.name,
        chainId,
        description: vault.description,
        tvlUsd: vault.tvlUsd,
        pricePerShare: vault.pricePerShare,
        pricePerShareUsd: vault.pricePerShareUsd,
        performance24h: vault.performance24h,
        performance7d: vault.performance7d,
        performance30d: vault.performance30d,
        performance90d: vault.performance90d,
        apy,
        apyBoost: vault.apyBoost,
        apyVote: vault.apyVote,
        tokens: tokens.length > 0 ? tokens : undefined,
        protocols: vault.protocols,
        depositStrategy: vault.depositStrategy,
        balances: vault.balances,
        depositFee: vault.depositFee,
        withdrawFee: vault.withdrawFee,
        managementFee: vault.managementFee,
        performanceFee: vault.performanceFee,
        vaultAnalytics: vault.vaultAnalytics,
      })
    })

  // Enhance with data from available tokens (for metrics and additional token info)
  safeAvailableTokens.forEach((tokenData) => {
    tokenData.strategies
      .filter((strategy) => strategy.name?.startsWith(VAULT_NAME_PREFIX))
      .forEach((strategy) => {
        const address = strategy.vault_address?.toLowerCase()
        if (!address || !vaultMap.has(address)) return

        const vault = vaultMap.get(address)!
        
        // Enrich existing tokens with logoUrl from available-tokens
        if (vault.tokens && tokenData.token.address) {
          const tokenAddrLower = tokenData.token.address.toLowerCase()
          vault.tokens = vault.tokens.map((token) => {
            if (token.address.toLowerCase() === tokenAddrLower) {
              return {
                ...token,
                logoUrl: tokenData.token.logoUrl || token.logoUrl,
                symbol: tokenData.token.symbol || token.symbol,
                name: tokenData.token.name || token.name,
              }
            }
            return token
          })
        }

        // Update metrics if better data available
        if (strategy.tvlUsd && !vault.tvlUsd) {
          vault.tvlUsd = strategy.tvlUsd
        }
        
        if (strategy.pricePerShare && !vault.pricePerShare) {
          vault.pricePerShare = strategy.pricePerShare
        }

        // Update APY if available
        const strategyAPY = extractAPY(strategy.apy)
        if (strategyAPY !== undefined && vault.apy === undefined) {
          vault.apy = strategyAPY
        }

        // Update performance if not already set
        if (strategy.performance24h && !vault.performance24h) {
          vault.performance24h = strategy.performance24h
        }
        if (strategy.performance7d && !vault.performance7d) {
          vault.performance7d = strategy.performance7d
        }
        if (strategy.performance30d && !vault.performance30d) {
          vault.performance30d = strategy.performance30d
        }
        if (strategy.performance90d && !vault.performance90d) {
          vault.performance90d = strategy.performance90d
        }
      })
  })

  // Enhance with data from strategies endpoint (fallback)
  strategies
    .filter((strategy: any) => strategy.name?.startsWith(VAULT_NAME_PREFIX))
    .forEach((strategy: any) => {
      const address = (strategy.vault_address || strategy.position_address)?.toLowerCase()
      if (!address) return

      if (!vaultMap.has(address)) {
        // Create new vault entry if it doesn't exist
        const chainId = normalizeChainId(strategy.chain)
        vaultMap.set(address, {
          address: strategy.vault_address || strategy.position_address,
          name: strategy.name,
          chainId,
          description: strategy.description,
          tvlUsd: strategy.metrics?.tvlUsd || strategy.value_usd,
          pricePerShare: strategy.metrics?.pricePerShare,
          pricePerShareUsd: strategy.metrics?.pricePerShareUsd,
          apy: extractAPY(strategy.metrics?.vault_analysis?.apy),
          tokens: extractTokensFromDeposits(strategy.metrics?.vault_analysis?.deposits),
          vaultAnalytics: strategy.metrics?.vault_analysis,
        })
      } else {
        // Enhance existing vault
        const vault = vaultMap.get(address)!
        
        // Fill in missing data
        if (!vault.tvlUsd && (strategy.metrics?.tvlUsd || strategy.value_usd)) {
          vault.tvlUsd = strategy.metrics?.tvlUsd || strategy.value_usd
        }
        
        if (!vault.apy) {
          vault.apy = extractAPY(strategy.metrics?.vault_analysis?.apy)
        }
        
        if (!vault.tokens || vault.tokens.length === 0) {
          vault.tokens = extractTokensFromDeposits(strategy.metrics?.vault_analysis?.deposits)
        }
        
        if (!vault.vaultAnalytics && strategy.metrics?.vault_analysis) {
          vault.vaultAnalytics = strategy.metrics.vault_analysis
        }
      }
    })

  const result = Array.from(vaultMap.values())
  console.log('[vaultService] Final aggregated vaults:', {
    count: result.length,
    addresses: result.map(v => v.address),
    names: result.map(v => v.name),
  })

  return result
}

/**
 * Fetches a single vault by address
 */
export async function fetchVaultByAddress(address: string): Promise<AggregatedVault | null> {
  const vaults = await fetchAggregatedVaults()
  const addressLower = address.toLowerCase()
  return vaults.find((v) => v.address.toLowerCase() === addressLower) || null
}

