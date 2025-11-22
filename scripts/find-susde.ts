/**
 * Quick script to find sUSDe in tokenlist
 */
import { FactorTokenlist } from "@factordao/tokenlist"

const tokenlist = new FactorTokenlist(8453 as any)
const allTokens = tokenlist.getAllGeneralTokens()

console.log("Searching for sUSDe variants...\n")

const searchTerms = ['susde', 'sUSDe', 'SUSDE', 'staked usde', 'stakedUSDe']

for (const term of searchTerms) {
  const found = allTokens.filter((t: any) => 
    t.symbol?.toLowerCase().includes(term.toLowerCase()) ||
    t.name?.toLowerCase().includes(term.toLowerCase())
  )
  
  if (found.length > 0) {
    console.log(`Found with "${term}":`)
    found.forEach((t: any) => {
      console.log(`  ${t.symbol} - ${t.name} - ${t.address}`)
    })
    console.log()
  }
}

