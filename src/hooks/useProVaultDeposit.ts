import { useState } from 'react'
import { erc20ABI } from '@factordao/contracts'
import { ChainId } from '@factordao/sdk'
import { StudioProVault } from '@factordao/sdk-studio'
// Type definition for token metadata
type TokenMetadata = {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}
import BigNumber from 'bignumber.js'
import { Address, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { useSendTransaction, useWriteContract } from 'wagmi'
import { environment } from '@/lib/constants/dev'
import { BASE_CHAIN_ID, getBaseRpcUrl } from '@/lib/constants/rpc'

interface UseProVaultDepositProps {
  vaultAddress: Address
  token: TokenMetadata | undefined
  amount: string
  receiverAddress: Address
  onSuccess?: () => void
}

export function useProVaultDeposit({
  vaultAddress,
  token,
  amount,
  receiverAddress,
  onSuccess,
}: UseProVaultDepositProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()
  const [steps, setSteps] = useState({
    approve: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    deposit: 'idle' as 'idle' | 'loading' | 'success' | 'error',
  })

  const getCurrentAllowance = async () => {
    if (!token) return BigNumber(0)
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(getBaseRpcUrl()),
      })
      const allowance = await publicClient.readContract({
        abi: erc20ABI,
        address: token.address as Address,
        functionName: 'allowance',
        args: [receiverAddress, vaultAddress],
      })
      return BigNumber(allowance.toString())
    } catch (error) {
      return BigNumber(0)
    }
  }

  const handleDepositWithApproval = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setSteps({ approve: 'loading', deposit: 'idle' })
      const currentAllowance = await getCurrentAllowance()
      const tokenAmount = BigNumber(amount)
        .multipliedBy(BigNumber(10).pow(token.decimals))
        .integerValue(BigNumber.ROUND_DOWN)
      if (currentAllowance.isLessThan(tokenAmount)) {
        const hash = await writeContractAsync({
          address: token.address as Address,
          abi: erc20ABI,
          functionName: 'approve',
          chain: base,
          account: receiverAddress,
          args: [vaultAddress, BigInt(tokenAmount.toFixed(0))],
        })
        const publicClient = createPublicClient({
          chain: base,
          transport: http(getBaseRpcUrl()),
        })
        const allowanceReceipt = await publicClient.waitForTransactionReceipt({
          hash,
        })
        if (!allowanceReceipt) {
          throw new Error('Allowance transaction failed')
        }
      }
      setSteps({ approve: 'success', deposit: 'loading' })

      const proVault = new StudioProVault({
        chainId: ChainId.BASE,
        vaultAddress,
        environment: environment,
        jsonRpcUrl: getBaseRpcUrl(),
      })

      // Create deposit payload
      const payload = {
        assetAddress: token.address,
        amountBN: tokenAmount,
        receiverAddress,
      }

      // Use depositAssetAndExecute to automatically execute deposit strategy
      // This will execute any configured deposit strategy (e.g., publishPairs for Aqua)
      // If no strategy is configured, it behaves like a regular deposit
      const depositData = proVault.depositAssetAndExecute(payload)
      const hash = await sendTransactionAsync({
        ...depositData,
        chainId: BASE_CHAIN_ID,
      })

      const publicClient = createPublicClient({
        chain: base,
        transport: http(getBaseRpcUrl()),
      })
      const depositReceipt = await publicClient.waitForTransactionReceipt({
        hash,
      })
      if (!depositReceipt) {
        throw new Error('Deposit transaction failed')
      }
      setSteps({ approve: 'success', deposit: 'success' })
      setIsLoading(false)
      onSuccess?.()
    } catch (error) {
      setIsLoading(false)
      setSteps({ approve: 'error', deposit: 'error' })
      throw error
    }
  }

  return {
    handleDepositWithApproval,
    isLoading,
    steps,
  }
}

