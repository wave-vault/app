import { Address } from 'viem'

// XYCSwap DEX address on Base
export const XYC_SWAP_ADDRESS = (import.meta.env.VITE_XYC_SWAP_ADDRESS ||
  '0x984E806a109E8Abd70306E6111180ab4e235FF4e') as Address

// Subgraph URL for Aqua pairs
export const SUBGRAPH_URL = 
  'https://api.goldsky.com/api/public/project_cmgzitcts001c5np28moc9lyy/subgraphs/onewave/backend-0.0.5/gn'

// Default slippage tolerance in basis points (100 = 1%)
export const DEFAULT_SLIPPAGE_BPS = 100n // 1%

// Slippage preset values (in percentage, not basis points)
export const SLIPPAGE_PRESETS = [0.1, 0.5, 1, 3] as const

// Convert percentage to basis points
export function percentageToBps(percentage: number): bigint {
  return BigInt(Math.round(percentage * 100))
}

// Convert basis points to percentage
export function bpsToPercentage(bps: bigint): number {
  return Number(bps) / 100
}

