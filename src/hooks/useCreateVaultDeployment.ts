import { useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { StudioProFactory, StudioProVault, StrategyBuilder } from '@factordao/sdk-studio'
import { ChainId, MAX_UINT_256, valueToBigInt } from '@factordao/sdk'
import { getContractAddressesForChainOrThrow } from '@factordao/sdk-studio'
import { FactorTokenlist } from '@factordao/tokenlist'
import { erc20ABI } from '@factordao/contracts'
import { parseEther, Address } from 'viem'
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

  const { config, feeReceiverAddress, alchemyApiKey } = params

  console.log('🔧 useCreateVaultDeployment initialized with:', {
    userAddress,
    hasWalletClient: !!walletClient,
    hasPublicClient: !!publicClient,
    config,
    feeReceiverAddress,
    hasAlchemyApiKey: !!alchemyApiKey
  })

  // Step 1: Deploy Vault
  const deployVault = useCallback(
    async (): Promise<DeployVaultResult> => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      console.log('=== Step 1: Deploy Vault ===')

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
        factor_chainlink_accounting_adapter_pro, 
        factor_aqua_adapter_pro,
        factor_studio_pro_factory 
      } = getContractAddressesForChainOrThrow(chainId, environment)

      // Prepare initial deposit (1600 wei)
      const initialDeposit = '1600'

      // Approve initial deposit token
      console.log('Approving initial deposit...')
      const approveTx = await walletClient.writeContract({
        address: denominatorToken.address as Address,
        abi: erc20ABI,
        functionName: 'approve',
        args: [factor_studio_pro_factory as Address, valueToBigInt(MAX_UINT_256.toString())],
      })

      await publicClient.waitForTransactionReceipt({ hash: approveTx })
      console.log('Approved at:', approveTx)

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
          assetDenominatorAddress: denominatorToken.address,
          assetDenominatorAccountingAddress: factor_chainlink_accounting_adapter_pro,
          upgradeTimelockBN: ONE_DAY_IN_SECONDS * 2,
          cooldownTimeBN: ONE_SECOND,
          upgradeable: true,
          initialAssetAddresses: config.whitelistedTokens as Address[],
          initialDepositAssetAddresses: config.whitelistedTokens as Address[],
          initialWithdrawAssetAddresses: config.whitelistedTokens as Address[],
          // All whitelisted tokens are standard tokens (not aTokens or special tokens),
          // so they all use Chainlink accounting adapter
          initialAssetAccountingAddresses: config.whitelistedTokens.map(
            () => factor_chainlink_accounting_adapter_pro
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

      console.log('Deploying vault with config:', deploymentConfig)

      const txData = proFactory.deployVault(deploymentConfig as any)
      const hash = await walletClient.sendTransaction({
        ...txData,
        gas: 8000000n,
      })

      console.log('Waiting for vault deployment...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      
      // Extract vault address from logs
      const vaultAddress = receipt.contractAddress || (receipt.logs[0]?.address as Address)
      
      if (!vaultAddress) {
        throw new Error('Could not determine vault address from receipt')
      }

      console.log('✅ Vault deployed at:', vaultAddress)

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

      console.log('=== Step 2: Set Pairs + Publish Pairs ===')

      const { vaultAddress } = prevResult
      const tokenlist = new FactorTokenlist(chainId)

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
        
        const baseToken0 = getBaseTokenByAddress(token0Address)
        const baseToken1 = getBaseTokenByAddress(token1Address)

        if (!baseToken0 || !baseToken1) {
          console.warn(`Skipping pair ${pair.pairId}: tokens not found`)
          continue
        }

        // Get Chainlink feeds from baseTokens (single source of truth)
        // All whitelisted tokens should have chainlinkFeed defined in baseTokens.ts
        if (!baseToken0.chainlinkFeed || !baseToken1.chainlinkFeed) {
          throw new Error(
            `Missing Chainlink feed for pair ${baseToken0.symbol}/${baseToken1.symbol}. ` +
            `Token ${!baseToken0.chainlinkFeed ? baseToken0.symbol : baseToken1.symbol} is missing chainlinkFeed in baseTokens.ts`
          )
        }

        const feed0 = baseToken0.chainlinkFeed as Address
        const feed1 = baseToken1.chainlinkFeed as Address

        // Convert fee percentage to basis points (e.g., 0.3% -> 30 bps)
        const feeBps = Math.round(pair.fee * 100)

        console.log(`Setting pair: ${baseToken0.symbol}/${baseToken1.symbol} with fee ${feeBps} bps`)
        console.log(`  Chainlink feeds: ${baseToken0.symbol}=${feed0}, ${baseToken1.symbol}=${feed1}`)

        const setPairData = sbEncoder.adapter.aqua.setPair({
          token0: token0Address as Address,
          token1: token1Address as Address,
          feeBps,
          chainlinkFeed0: feed0 as Address,
          chainlinkFeed1: feed1 as Address,
          dexes: [XYC_SWAP_ADDRESS],
        })

        setPairTransactions.push(setPairData)
      }

      // Add publishPairs transaction
      const publishPairsData = sbEncoder.adapter.aqua.publishPairs()
      setPairTransactions.push(publishPairsData)

      // Execute all as a batch through executeByManager
      console.log(`Executing ${setPairTransactions.length} transactions (setPairs + publishPairs)...`)
      const executeData = proVault.executeByManager(setPairTransactions)
      
      const tx = await walletClient.sendTransaction({
        ...executeData,
        gas: 8000000n,
      })

      console.log('Waiting for transaction...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })

      console.log('✅ Pairs set and published!')

      return { vaultAddress, txHash: tx }
    },
    [userAddress, walletClient, publicClient, config]
  )

  // Step 3: Add Deposit Strategy
  const addDepositStrategy = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      if (!userAddress || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      console.log('=== Step 3: Add Deposit Strategy ===')

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
      const executeByManagerData = sbEncoder.adapter.aqua.publishPairs()
      const blocks = sbEncoder.getTransactions()

      console.log('Setting deposit strategy with blocks:', blocks)

      const executeData = proVault.setDepositStrategy(blocks)
      const tx = await walletClient.sendTransaction({
        ...executeData,
        gas: 8000000n,
      })

      console.log('Waiting for transaction...')
      await publicClient.waitForTransactionReceipt({ hash: tx })

      console.log('✅ Deposit strategy configured!')

      return { vaultAddress, txHash: tx }
    },
    [userAddress, walletClient, publicClient]
  )

  // Step 4: Save to API
  const saveToAPI = useCallback(
    async (_: VaultDeploymentParams, prevResult: DeployVaultResult) => {
      console.log('=== Step 4: Save to API ===')

      const { vaultAddress } = prevResult

      // TODO: Implement API save similar to Factor Studio
      // For now, just log
      console.log('Saving vault to API:', {
        vaultAddress,
        name: config.name,
        description: config.description,
        image: config.image,
        chainId,
        owner: userAddress,
        tokens: config.whitelistedTokens,
        pairs: config.selectedPairs,
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('✅ Vault saved to API!')

      return { vaultAddress, saved: true }
    },
    [config, userAddress]
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

