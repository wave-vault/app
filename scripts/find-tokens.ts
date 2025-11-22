import { FactorTokenlist } from "@factordao/tokenlist"

const tokenlist = new FactorTokenlist(8453 as any)
const allTokens = tokenlist.getAllGeneralTokens()

const symbolsToFind = ['wETH', 'wBTC', 'cbBTC', 'lBTC']

console.log("Searching for tokens...\n")

for (const symbol of symbolsToFind) {
  const found = allTokens.filter((t: any) => 
    t.symbol?.toLowerCase() === symbol.toLowerCase() ||
    t.symbol?.toUpperCase() === symbol.toUpperCase()
  )
  
  if (found.length > 0) {
    console.log(`${symbol}:`)
    found.forEach((t: any) => {
      console.log(`  Symbol: ${t.symbol}`)
      console.log(`  Name: ${t.name}`)
      console.log(`  Address: ${t.address}`)
      console.log(`  Decimals: ${t.decimals}`)
      console.log()
    })
  } else {
    console.log(`${symbol}: NOT FOUND\n`)
  }
}

