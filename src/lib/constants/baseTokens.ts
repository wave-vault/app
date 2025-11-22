/**
 * Whitelisted tokens for BASE chain with Chainlink price feeds
 * These tokens are available for vault creation
 * Addresses are for BASE chain (chainId: 8453)
 */

export interface BaseToken {
  symbol: string
  name: string
  address: `0x${string}`
  decimals: number
  logoURI?: string
  chainlinkFeed?: string // Chainlink price feed address on BASE
}

// BASE chain token addresses (chainId: 8453)
// These tokens have Chainlink price feeds available on BASE
// Addresses verified for BASE mainnet
export const BASE_WHITELISTED_TOKENS: BaseToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    chainlinkFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // USDC/USD on BASE
  },
  {
    symbol: "EURC",
    name: "EURC",
    address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
    decimals: 6,
    chainlinkFeed: "0x0000000000000000000000000000000000000000", // No direct feed
  },
  {
    symbol: "wETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD on BASE
  },
  {
    symbol: "wBTC",
    name: "Wrapped Bitcoin Base",
    address: "0xF8c700552B67D64362Af3F2D48B098E5AC9b9870",
    decimals: 8,
    chainlinkFeed: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", // BTC/USD on BASE
  },
  {
    symbol: "cbBTC",
    name: "Coinbase Wrapped BTC",
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
    chainlinkFeed: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", // BTC/USD on BASE
  },
  {
    symbol: "lBTC",
    name: "Lombard Staked Bitcoin",
    address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",
    decimals: 8,
    chainlinkFeed: "0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F", // BTC/USD on BASE
  },
  {
    symbol: "USDe",
    name: "USDe",
    address: "0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34",
    decimals: 18,
    chainlinkFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // Use USDC/USD as proxy
  },
  {
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD with conversion
  },
  {
    symbol: "GHO",
    name: "Gho Token",
    address: "0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee",
    decimals: 18,
    chainlinkFeed: "0x0000000000000000000000000000000000000000", // No direct feed
  },
  {
    symbol: "LINK",
    name: "Chainlink (Universal)",
    address: "0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196",
    decimals: 18,
    chainlinkFeed: "0xe7cD535c89f66781619db3d0aD48D1b9Cc3C81b5", // LINK/USD on BASE
  },
  {
    symbol: "renzo",
    name: "Renzo Restaked ETH",
    address: "0x2416092f143378750bb29b79ed961ab195cceea5",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD with conversion
  },
  {
    symbol: "wstETH",
    name: "Wrapped liquid staked Ether 2.0",
    address: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD with conversion
  },
  {
    symbol: "USDbC",
    name: "USD Base Coin",
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    decimals: 6,
    chainlinkFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B", // Use USDC/USD
  },
  {
    symbol: "rsETHWrapper",
    name: "rsETHWrapper",
    address: "0x1bc71130a0e39942a7658878169764bbd8a45993",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD with conversion
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
    decimals: 6,
    chainlinkFeed: "0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9", // USDT/USD on BASE
  },
  {
    symbol: "weETH",
    name: "Wrapped eETH",
    address: "0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A",
    decimals: 18,
    chainlinkFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD with conversion
  },
]

/**
 * Get token info by address on BASE chain
 */
export function getBaseTokenByAddress(address: string): BaseToken | undefined {
  return BASE_WHITELISTED_TOKENS.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  )
}

/**
 * Get all whitelisted tokens for BASE chain
 */
export function getBaseWhitelistedTokens(): BaseToken[] {
  return BASE_WHITELISTED_TOKENS
}

