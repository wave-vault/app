import { useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient, useSignMessage } from 'wagmi'
import { StudioProFactory, StudioProVault, StrategyBuilder } from '@factordao/sdk-studio'
import { ChainId, MAX_UINT_256, valueToBigInt } from '@factordao/sdk'
import { getContractAddressesForChainOrThrow } from '@factordao/sdk-studio'
import { FactorTokenlist } from '@factordao/tokenlist'
import { erc20ABI } from '@factordao/contracts'
import { parseEther, parseUnits, Address, getAddress } from 'viem'
import { useTransactionFlow, TransactionFlowStep } from './useTransactionFlow'
import { getBaseTokenByAddress } from '@/lib/constants/baseTokens'

const environment = 'testing' as const
const chainId = ChainId.BASE
const ONE_DAY_IN_SECONDS = 1 * 24 * 60 * 60
const ONE_SECOND = 1

export interface VaultDeploymentConfig {
  name: string
  description?: string
  image?: string
  depositFee: number // percentage
  withdrawFee: number
  managementFee: number
  performanceFee: number
  whitelistedTokens: string[]
  selectedPairs: Array<{
    pairId: string
    fee: number // percentage
  }>
}

export interface VaultDeploymentParams {
  config: VaultDeploymentConfig
  feeReceiverAddress: Address
  alchemyApiKey: string
}

interface DeployVaultResult {
  vaultAddress: Address
  txHash: string
}

// XYCSwap DEX address
const XYC_SWAP_ADDRESS = (import.meta.env.VITE_XYC_SWAP_ADDRESS ||
  '0x191066ee11118d60df8c18b41e6705bb685c2cb0') as Address

export function useCreateVaultDeployment(params: VaultDeploymentParams) {
  const { address: userAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { signMessageAsync } = useSignMessage()

  const { config, feeReceiverAddress } = params


  // Step 1: Deploy Vault
  const deployVault = useCallback(
    async (): Promise<DeployVaultResult> => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const tokenlist = new FactorTokenlist(chainId)
      
      // Get the first whitelisted token for initial deposit (prefer USDC)
      const usdcToken = tokenlist.getTokenFromSymbol('USDC')
      const denominatorToken = config.whitelistedTokens.includes(usdcToken.address.toLowerCase())
        ? usdcToken
        : tokenlist.getAllGeneralTokens().find((t: any) => 
            config.whitelistedTokens.includes(t.address?.toLowerCase())
          )

      if (!denominatorToken) {
        throw new Error('No valid denominator token found')
      }

      const { 
        factor_aqua_adapter_pro,
        factor_studio_pro_factory 
      } = getContractAddressesForChainOrThrow(chainId, environment)

      // Use fixed Chainlink accounting adapter address (normalize to checksum format)
      const CHAINLINK_ACCOUNTING_ADAPTER = getAddress('0xE06d1274fFA08bA9965D6BE89afea04B811260F4')
      const denominatorAccountingAdapter = CHAINLINK_ACCOUNTING_ADAPTER

      // Prepare initial deposit (0 units - no initial deposit required)
      // The SDK expects the value in smallest units (wei) as a string
      const initialDepositAmount = '0' // No initial deposit required
      const tokenDecimals = denominatorToken.decimals || 18
      const initialDeposit = parseUnits(
        initialDepositAmount,
        tokenDecimals
      ).toString()

      // Check current allowance before approving
      const currentAllowance = await publicClient.readContract({
        address: denominatorToken.address as Address,
        abi: erc20ABI,
        functionName: 'allowance',
        args: [userAddress, factor_studio_pro_factory as Address],
      })
      
      // initialDeposit is already in wei format (from parseUnits above), so just convert to BigInt
      const initialDepositBNForApproval = BigInt(initialDeposit)
      const needsApproval = currentAllowance < initialDepositBNForApproval
      
      if (needsApproval) {
        // Approve initial deposit token only if needed
        const approveTx = await walletClient.writeContract({
          address: denominatorToken.address as Address,
          abi: erc20ABI,
          functionName: 'approve',
          args: [factor_studio_pro_factory as Address, valueToBigInt(MAX_UINT_256.toString())],
        })

        await publicClient.waitForTransactionReceipt({ hash: approveTx })
      }

      // Build deployment config
      const proFactory = new StudioProFactory({
        chainId,
        environment,
      })

      // Convert percentages to basis points (1% = 0.01 ether)
      const depositFeeBN = parseEther((config.depositFee / 100).toString()).toString()
      const withdrawFeeBN = parseEther((config.withdrawFee / 100).toString()).toString()
      const performanceFeeBN = parseEther((config.performanceFee / 100).toString()).toString()
      const managementFeeBN = parseEther((config.managementFee / 100).toString()).toString()

      const deploymentConfig = {
        initialDepositBN: initialDeposit,
        name: config.name,
        symbol: config.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20).toUpperCase(),
        configParams: {
          assetDenominatorAddress: denominatorToken.address as Address,
          assetDenominatorAccountingAddress: denominatorAccountingAdapter,
          upgradeTimelockBN: ONE_DAY_IN_SECONDS * 2,
          cooldownTimeBN: ONE_SECOND,
          upgradeable: true,
          initialAssetAddresses: config.whitelistedTokens as Address[],
          initialDepositAssetAddresses: config.whitelistedTokens as Address[],
          initialWithdrawAssetAddresses: config.whitelistedTokens as Address[],
          // Use fixed Chainlink accounting adapter for all tokens
          initialAssetAccountingAddresses: config.whitelistedTokens.map(
            () => CHAINLINK_ACCOUNTING_ADAPTER
          ) as Address[],
          initialDebtAddresses: [] as Address[],
          initialDebtAccountingAddresses: [] as Address[],
          initialManagerAdapters: [factor_aqua_adapter_pro] as Address[],
          initialOwnerAdapters: [] as Address[],
          initialWithdrawAdapters: [factor_aqua_adapter_pro] as Address[],
          maxCapBN: MAX_UINT_256,
          maxDebtRatioBN: 1e18,
          cumulativePriceDeviationAllowanceBpsBN: 10_000,
        },
        feeParams: {
          feeReceiver: feeReceiverAddress,
          depositFeeBN,
          withdrawFeeBN,
          performanceFeeBN,
          managementFeeBN,
        },
      }

      const txData = proFactory.deployVault(deploymentConfig as any)
      const hash = await walletClient.sendTransaction({
        ...txData,
        gas: 8000000n,
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      // Extract vault address from logs
      const vaultAddress = receipt.contractAddress || (receipt.logs[0]?.address as Address)
      
      if (!vaultAddress) {
        throw new Error('Could not determine vault address from receipt')
      }

      return {
        vaultAddress,
        txHash: hash,
      }
    },
    [userAddress, walletClient, publicClient, config, feeReceiverAddress]
  )

  // Step 2: Set Pairs + Publish Pairs (batched)
  const setPairsAndPublish = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const { vaultAddress } = prevResult

      const proVault = new StudioProVault({
        chainId,
        vaultAddress,
        environment,
      })

      const sbEncoder = new StrategyBuilder({
        chainId,
        isProAdapter: true,
        environment,
      })

      // Set each pair
      const setPairTransactions = []
      
      for (const pair of config.selectedPairs) {
        const [token0Address, token1Address] = pair.pairId.split('-')
        
        // Normalize addresses to checksum format
        const token0AddressNormalized = getAddress(token0Address.toLowerCase() as `0x${string}`)
        const token1AddressNormalized = getAddress(token1Address.toLowerCase() as `0x${string}`)
        
        const baseToken0 = getBaseTokenByAddress(token0AddressNormalized)
        const baseToken1 = getBaseTokenByAddress(token1AddressNormalized)

        if (!baseToken0 || !baseToken1) {
          throw new Error(
            `Token not found in baseTokens for pair ${pair.pairId}. ` +
            `Token0: ${token0AddressNormalized}, Token1: ${token1AddressNormalized}. ` +
            `Please ensure both tokens are in the whitelist.`
          )
        }

        // Get Chainlink feeds from baseTokens (single source of truth)
        // All whitelisted tokens MUST have a valid chainlinkFeed defined in baseTokens.ts
        // Zero address is NOT allowed - tokens without feeds cannot be used in pairs
        const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
        const feed0 = baseToken0.chainlinkFeed
        const feed1 = baseToken1.chainlinkFeed
        
        if (!feed0 || !feed1 || feed0 === ZERO_ADDRESS || feed1 === ZERO_ADDRESS) {
          throw new Error(
            `Invalid Chainlink feed for pair ${baseToken0.symbol}/${baseToken1.symbol}. ` +
            `Token ${!feed0 || feed0 === ZERO_ADDRESS ? baseToken0.symbol : baseToken1.symbol} does not have a valid chainlinkFeed. ` +
            `Please ensure all tokens used in pairs have a valid Chainlink feed address in baseTokens.ts (zero address is not allowed).`
          )
        }

        const feed0Address = getAddress(feed0.toLowerCase() as `0x${string}`)
        const feed1Address = getAddress(feed1.toLowerCase() as `0x${string}`)

        // Convert fee percentage to basis points (e.g., 0.3% -> 30 bps)
        const feeBps = Math.round(pair.fee * 100)
        
        if (feeBps <= 0 || feeBps > 10000) {
          throw new Error(
            `Invalid fee for pair ${baseToken0.symbol}/${baseToken1.symbol}. ` +
            `Fee must be between 0.01% and 100% (1-10000 basis points). Got: ${pair.fee}% (${feeBps} bps)`
          )
        }

        try {
          const setPairData = sbEncoder.adapter.aqua.setPair({
            token0: token0AddressNormalized,
            token1: token1AddressNormalized,
            feeBps,
            chainlinkFeed0: feed0Address,
            chainlinkFeed1: feed1Address,
            dexes: [XYC_SWAP_ADDRESS],
          })

          setPairTransactions.push(setPairData)
        } catch (error: any) {
          throw new Error(
            `Failed to create setPair transaction for ${baseToken0.symbol}/${baseToken1.symbol}: ${error.message}`
          )
        }
      }

      // Check if we have any valid pairs to set
      if (setPairTransactions.length === 0) {
        throw new Error('No valid pairs to set. Please check that all tokens in your pairs have valid Chainlink feeds.')
      }

      // Add publishPairs transaction
      let publishPairsData
      try {
        publishPairsData = sbEncoder.adapter.aqua.publishPairs()
        setPairTransactions.push(publishPairsData)
      } catch (error: any) {
        throw new Error(`Failed to create publishPairs transaction: ${error.message}`)
      }

      // Execute all as a batch through executeByManager
      let executeData
      try {
        executeData = proVault.executeByManager(setPairTransactions)
      } catch (error: any) {
        throw new Error(`Failed to prepare executeByManager transaction: ${error.message}`)
      }
      
      let tx
      try {
        tx = await walletClient.sendTransaction({
          ...executeData,
          gas: 8000000n,
        })
      } catch (error: any) {
        throw new Error(`Transaction failed: ${error.message || error.toString()}`)
      }

      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted. Please check the transaction details on the explorer.')
        }
      } catch (error: any) {
        throw new Error(`Failed to confirm transaction: ${error.message || error.toString()}`)
      }

      return { vaultAddress, txHash: tx }
    },
    [userAddress, walletClient, publicClient, config]
  )

  // Step 3: Add Public Strategy
  const addPublicStrategy = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const { vaultAddress } = prevResult

      const proVault = new StudioProVault({
        chainId,
        vaultAddress,
        environment,
      })

      // Encode strategy using SB
      const sbEncoder = new StrategyBuilder({
        chainId,
        isProAdapter: true,
        environment,
      })
      sbEncoder.adapter.aqua.publishPairs()
      const blocks = sbEncoder.getTransactions()

      // Execute by manager
      const executeData = proVault.setPublicStrategy(0, blocks)
      const tx = await walletClient.sendTransaction({
        ...executeData,
        gas: 8000000n,
      })

      await publicClient.waitForTransactionReceipt({ hash: tx })

      return { vaultAddress, txHash: tx }
    },
    [userAddress, walletClient, publicClient]
  )

  // Step 4: Add Deposit Strategy
  const addDepositStrategy = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const { vaultAddress } = prevResult

      const proVault = new StudioProVault({
        chainId,
        vaultAddress,
        environment,
      })

      const sbEncoder = new StrategyBuilder({
        chainId,
        isProAdapter: true,
        environment,
      })

      // Build deposit strategy: publishPairs on each deposit
      sbEncoder.adapter.aqua.publishPairs()
      const blocks = sbEncoder.getTransactions()

      const executeData = proVault.setDepositStrategy(blocks)
      const tx = await walletClient.sendTransaction({
        ...executeData,
        gas: 8000000n,
      })

      await publicClient.waitForTransactionReceipt({ hash: tx })

      return { vaultAddress, txHash: tx }
    },
    [userAddress, walletClient, publicClient]
  )

  // Step 5: Save to API
  const saveToAPI = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      if (!userAddress || !signMessageAsync) {
        throw new Error('Wallet not connected or sign message not available')
      }

      const { vaultAddress } = prevResult

      // Step 1: Request signature from user (same format as Factor Studio)
      const signatureMessage = `Save strategy: ${config.name}`
      
      const signature = await signMessageAsync({ message: signatureMessage })

      // Step 2: Prepare payload (similar to Factor Studio format)
      const payload = {
        signature,
        name: config.name,
        description: config.description || '',
        type: 'pro-vault',
        chain: chainId,
        status: 'deployed',
        owner: userAddress.toLowerCase(),
        vault_address: vaultAddress.toLowerCase(),
        strategy: {
          canvas: [], // Empty canvas for now, can be extended later
          metadata: {
            logoCID: config.image || '',
            depositAssetAddressesVisibility: config.whitelistedTokens,
            withdrawAssetAddressesVisibility: config.whitelistedTokens,
          },
        },
      }

      // Step 3: Send to API (using same endpoint as Factor Studio)
      const STATS_API_BASE = import.meta.env.VITE_STATS_API_BASE_URL || import.meta.env.VITE_STATS_API_BASE || 'https://api.factordao.com'
      const response = await fetch(`${STATS_API_BASE}/strategies/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `API error: ${response.statusText}`)
      }

      const savedStrategy = await response.json()

      if (savedStrategy.error) {
        throw new Error(savedStrategy.message || 'Failed to save vault to API')
      }

      return {
        vaultAddress,
        hash: savedStrategy.strategy?.hash,
        saved: true,
      }
    },
    [config, chainId, userAddress, signMessageAsync]
  )

  const flowSteps: TransactionFlowStep<VaultDeploymentParams>[] = [
    {
      title: 'Deploy Vault',
      execute: deployVault,
    },
    {
      title: 'Setup Pairs & Publish',
      execute: setPairsAndPublish,
    },
    {
      title: 'Add Public Strategy',
      execute: addPublicStrategy,
    },
    {
      title: 'Configure Deposit Strategy',
      execute: addDepositStrategy,
    },
    {
      title: 'Save to Database',
      execute: saveToAPI,
    },
  ]

  return useTransactionFlow<VaultDeploymentParams>({
    steps: flowSteps,
    executeParams: params,
  })
}

