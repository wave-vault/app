/**
 * Chainlink Price Feeds on BASE chain (chainId: 8453)
 * Official Chainlink feeds: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */

import { Address } from 'viem'

export const CHAINLINK_FEEDS_BASE: Record<string, Address> = {
  // ETH/USD - Used for WETH
  '0x4200000000000000000000000000000000000006': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  
  // USDC/USD
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
  
  // BTC/USD - Used for WBTC, cbBTC, lBTC
  '0xF8c700552B67D64362Af3F2D48B098E5AC9b9870': '0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F', // wBTC
  '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': '0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F', // cbBTC
  '0xecAc9C5F704e954931349Da37F60E39f515c11c1': '0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F', // lBTC
  
  // LINK/USD
  '0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196': '0xe7cD535c89f66781619db3d0aD48D1b9Cc3C81b5',
  
  // USDT/USD
  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2': '0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9',
  
  // Note: For tokens without direct feeds, you may need to use alternative strategies:
  // - cbETH, wstETH: Use ETH/USD feed with on-chain conversion rate
  // - USDe, EURC: May use USDC/USD as proxy or require custom oracle
  // - Others: Check Chainlink docs or use fallback pricing
  
  // cbETH (Coinbase Wrapped Staked ETH) - Can use ETH/USD with conversion
  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  
  // wstETH (Wrapped liquid staked Ether) - Can use ETH/USD with conversion
  '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  
  // weETH - Can use ETH/USD with conversion
  '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  
  // USDe - Can use USDC/USD as proxy
  '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
  
  // USDbC - Can use USDC/USD
  '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B',
  
  // EURC - May need custom handling (no direct feed)
  '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42': '0x0000000000000000000000000000000000000000',
  
  // GHO - May need custom handling
  '0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee': '0x0000000000000000000000000000000000000000',
  
  // rsETHWrapper - Can use ETH/USD with conversion
  '0x1bc71130a0e39942a7658878169764bbd8a45993': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  
  // renzo - Can use ETH/USD with conversion
  '0x2416092f143378750bb29b79ed961ab195cceea5': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
}

/**
 * Get Chainlink feed address for a token on BASE
 * Returns zero address if no feed is available
 */
export function getChainlinkFeed(tokenAddress: string): Address {
  const feed = CHAINLINK_FEEDS_BASE[tokenAddress.toLowerCase()]
  return feed || ('0x0000000000000000000000000000000000000000' as Address)
}

/**
 * Check if a token has a Chainlink feed
 */
export function hasChainlinkFeed(tokenAddress: string): boolean {
  const feed = getChainlinkFeed(tokenAddress)
  return feed !== '0x0000000000000000000000000000000000000000'
}

