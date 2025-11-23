import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { studioProV1ABI } from '@factordao/contracts'
import { formatUnits } from 'viem'
import { Address } from 'viem'
import { useMemo } from 'react'

interface UseVaultUserSharesProps {
  vaultAddress: Address
  chainId?: number
  pricePerShareUsd?: string
  denominatorAddress?: Address
}

export function useVaultUserShares({
  vaultAddress,
  chainId,
  pricePerShareUsd,
  denominatorAddress,
}: UseVaultUserSharesProps) {
  const { address: userAddress } = useAccount()

  // Read user shares from vault
  const { 
    data: sharesRaw, 
    isLoading: isLoadingShares,
    refetch: refetchShares 
  } = useReadContract({
    address: vaultAddress,
    abi: studioProV1ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: chainId,
    query: {
      enabled: !!userAddress && !!vaultAddress,
    },
  })

  // Read denominator decimals
  const { data: denominatorDecimals } = useReadContract({
    address: denominatorAddress,
    abi: [
      {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
      },
    ],
    functionName: 'decimals',
    chainId: chainId,
    query: {
      enabled: !!denominatorAddress,
    },
  })

  const decimals = denominatorDecimals ? Number(denominatorDecimals) : 18

  const userShares = useMemo(() => {
    if (!sharesRaw) {
      return {
        sharesRaw: '0',
        amount: '0',
        amountUSD: '0',
      }
    }

    const sharesBigInt = sharesRaw as bigint
    const sharesFormatted = formatUnits(sharesBigInt, decimals)
    const sharesNumber = parseFloat(sharesFormatted)
    const pricePerShare = pricePerShareUsd ? parseFloat(pricePerShareUsd) : 0
    const amountUSD = sharesNumber * pricePerShare

    return {
      sharesRaw: sharesBigInt.toString(),
      amount: sharesFormatted,
      amountUSD: amountUSD.toString(),
    }
  }, [sharesRaw, decimals, pricePerShareUsd])

  return {
    userShares,
    isLoading: isLoadingShares,
    refetchShares, // Expose refetch function to manually refresh shares balance
  }
}

