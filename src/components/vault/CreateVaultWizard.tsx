import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { TokenSelector } from "@/components/swap/TokenSelector"
import { PairSelector, SelectedPair } from "@/components/vault/PairSelector"
import { useAccount } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { getBaseTokenByAddress } from "@/lib/constants/baseTokens"
import { X } from "lucide-react"
import { FactorTokenlist } from "@factordao/tokenlist"
import { DeploymentProgressModal } from "@/components/vault/DeploymentProgressModal"
import { useCreateVaultDeployment } from "@/hooks/useCreateVaultDeployment"
import { Address } from "viem"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

const VAULT_NAME_PREFIX = "ethGlobal - wave: "

const vaultSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  depositFee: z.number().min(0).max(5),
  withdrawFee: z.number().min(0).max(5),
  managementFee: z.number().min(0).max(2),
  performanceFee: z.number().min(0).max(20),
  whitelistedTokens: z.array(z.string()).min(2, "Select at least 2 tokens"),
  selectedPairs: z.array(z.object({
    pairId: z.string(),
    fee: z.number().min(0.01, "Fee must be at least 0.01%").max(100),
  })).min(1, "Select at least one pair").refine(
    (pairs) => pairs.every((p) => p.fee > 0),
    { message: "All pairs must have a fee set" }
  ),
})

type VaultFormData = z.infer<typeof vaultSchema>

const steps = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Fees" },
  { id: 3, title: "Tokens" },
  { id: 4, title: "Review" },
]

export function CreateVaultWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [selectedPairs, setSelectedPairs] = useState<SelectedPair[]>([])
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false)
  const { isConnected, chainId = 8453, address: userAddress } = useAccount()
  const { openConnectModal } = useConnectModal()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Debug: log modal state changes
  useEffect(() => {
    console.log('🎭 Modal state changed:', isDeploymentModalOpen)
  }, [isDeploymentModalOpen])

  // Alchemy API key from environment
  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || ''
  
  // Fee receiver address (can be configured)
  const feeReceiverAddress = (userAddress || '0x917b3F413FCD5ABAFbE089427Bab65b11d482C4c') as Address

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<VaultFormData>({
    resolver: zodResolver(vaultSchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      depositFee: 0,
      withdrawFee: 0,
      managementFee: 0,
      performanceFee: 0,
      whitelistedTokens: [],
      selectedPairs: [] as SelectedPair[],
    },
  })

  // Debug: log form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('❌ Form validation errors:', errors)
    }
  }, [errors])

  const watchedName = watch("name")
  const displayName = watchedName
    ? `${VAULT_NAME_PREFIX}${watchedName}`
    : VAULT_NAME_PREFIX

  const onSubmit = async (data: VaultFormData) => {
    console.log('✅ Form validation passed!')
    console.log('📝 Form submitted with data:', data)
    
    // Check if wallet is connected
    if (!isConnected && openConnectModal) {
      console.log('⚠️ Wallet not connected, opening connect modal')
      openConnectModal()
      return
    }

    if (!alchemyApiKey) {
      console.log('⚠️ Alchemy API key missing')
      toast({
        title: "Configuration Error",
        description: "Alchemy API key not configured. Please set VITE_ALCHEMY_API_KEY in your environment.",
        variant: "destructive",
      })
      return
    }

    console.log('✅ Opening deployment modal')
    // Open deployment modal
    setIsDeploymentModalOpen(true)
  }

  const onSubmitError = (errors: any) => {
    console.log('❌ Form validation FAILED!')
    console.error('Validation errors:', errors)
    toast({
      title: "Form Validation Error",
      description: "Please check all required fields and fix any errors.",
      variant: "destructive",
    })
  }

  const handleDeploymentComplete = (vaultAddress: string) => {
    console.log('🎉 Deployment complete! Vault address:', vaultAddress)
    toast({
      title: "Vault Deployed Successfully!",
      description: `Your vault has been deployed at ${vaultAddress.slice(0, 10)}...`,
    })
    
    // Navigate to vault detail page after a short delay
    setTimeout(() => {
      setIsDeploymentModalOpen(false)
      navigate(`/vault/${vaultAddress}`)
    }, 2000)
  }

  const handleDeploymentModalClose = () => {
    console.log('🔒 Deployment modal closed')
    setIsDeploymentModalOpen(false)
  }

  // Get form values for deployment
  const formValues = watch()
  
  const deploymentConfig = useMemo(() => {
    const config = {
      name: `${VAULT_NAME_PREFIX}${formValues.name || ''}`,
      description: formValues.description || '',
      image: formValues.image || '',
      depositFee: formValues.depositFee || 0,
      withdrawFee: formValues.withdrawFee || 0,
      managementFee: formValues.managementFee || 0,
      performanceFee: formValues.performanceFee || 0,
      whitelistedTokens: formValues.whitelistedTokens || [],
      selectedPairs: formValues.selectedPairs || [],
    }
    console.log('🔧 Deployment config updated:', config)
    return config
  }, [formValues])

  // Only create transaction flow if modal is open
  const transactionFlow = useCreateVaultDeployment({
    config: deploymentConfig,
    feeReceiverAddress,
    alchemyApiKey,
  })

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Generate pairs from selected tokens with token info and unique IDs
  const generatePairs = useMemo(() => {
    const pairs: Array<{ tokenA: any; tokenB: any; id: string }> = []
    
    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      
      for (let i = 0; i < selectedTokens.length; i++) {
        for (let j = i + 1; j < selectedTokens.length; j++) {
          const addrA = selectedTokens[i]
          const addrB = selectedTokens[j]
          
          const baseTokenA = getBaseTokenByAddress(addrA)
          const baseTokenB = getBaseTokenByAddress(addrB)
          
          if (!baseTokenA || !baseTokenB) continue
          
          // Get logos from tokenlist
          const tokenlistTokenA = allTokens.find((t: any) => 
            t.address?.toLowerCase() === addrA.toLowerCase()
          )
          const tokenlistTokenB = allTokens.find((t: any) => 
            t.address?.toLowerCase() === addrB.toLowerCase()
          )
          
          // Create unique pair ID (always use lower addresses in consistent order)
          const addrALower = addrA.toLowerCase()
          const addrBLower = addrB.toLowerCase()
          const pairId = addrALower < addrBLower 
            ? `${addrALower}-${addrBLower}`
            : `${addrBLower}-${addrALower}`
          
          pairs.push({
            id: pairId,
            tokenA: {
              ...baseTokenA,
              address: addrA,
              logoURI: tokenlistTokenA?.logoUrl || baseTokenA.logoURI || '',
              symbol: tokenlistTokenA?.symbol || baseTokenA.symbol,
            },
            tokenB: {
              ...baseTokenB,
              address: addrB,
              logoURI: tokenlistTokenB?.logoUrl || baseTokenB.logoURI || '',
              symbol: tokenlistTokenB?.symbol || baseTokenB.symbol,
            },
          })
        }
      }
    } catch (error) {
      // Fallback: use base tokens only
      for (let i = 0; i < selectedTokens.length; i++) {
        for (let j = i + 1; j < selectedTokens.length; j++) {
          const baseTokenA = getBaseTokenByAddress(selectedTokens[i])
          const baseTokenB = getBaseTokenByAddress(selectedTokens[j])
          if (baseTokenA && baseTokenB) {
            const addrALower = selectedTokens[i].toLowerCase()
            const addrBLower = selectedTokens[j].toLowerCase()
            const pairId = addrALower < addrBLower 
              ? `${addrALower}-${addrBLower}`
              : `${addrBLower}-${addrALower}`
            pairs.push({ 
              id: pairId,
              tokenA: { ...baseTokenA, address: selectedTokens[i] }, 
              tokenB: { ...baseTokenB, address: selectedTokens[j] } 
            })
      }
    }
      }
    }
    
    return pairs
  }, [selectedTokens, chainId])

  // Get selected token info for chips display with logos from tokenlist
  const selectedTokensInfo = useMemo(() => {
    try {
      const tokenlist = new FactorTokenlist(chainId as any)
      const allTokens = tokenlist.getAllGeneralTokens()
      
      return selectedTokens
        .map((addr) => {
          const baseToken = getBaseTokenByAddress(addr)
          if (!baseToken) return null
          
          // Try to get logo from tokenlist
          const tokenlistToken = allTokens.find((t: any) => 
            t.address?.toLowerCase() === addr.toLowerCase()
          )
          
          return {
            ...baseToken,
            logoURI: tokenlistToken?.logoUrl || baseToken.logoURI || '',
            symbol: tokenlistToken?.symbol || baseToken.symbol,
          }
        })
        .filter(Boolean)
    } catch (error) {
      // Fallback to base tokens only
      return selectedTokens
        .map((addr) => getBaseTokenByAddress(addr))
        .filter(Boolean)
    }
  }, [selectedTokens, chainId])

  const toggleToken = (tokenAddress: string) => {
    const addressLower = tokenAddress.toLowerCase()
    if (selectedTokens.includes(addressLower)) {
      const newTokens = selectedTokens.filter((addr) => addr !== addressLower)
      setSelectedTokens(newTokens)
      setValue("whitelistedTokens", newTokens)
      // Reset selected pairs when tokens change (pairs depend on tokens)
      setSelectedPairs([])
      setValue("selectedPairs", [])
    } else {
      const newTokens = [...selectedTokens, addressLower]
      setSelectedTokens(newTokens)
      setValue("whitelistedTokens", newTokens)
      // Reset selected pairs when tokens change (pairs depend on tokens)
      setSelectedPairs([])
      setValue("selectedPairs", [])
    }
  }

  // Filter out invalid pairs when tokens change
  useEffect(() => {
    const validPairIds = generatePairs.map((pair) => pair.id)
    const filteredPairs = selectedPairs.filter((sp) => validPairIds.includes(sp.pairId))
    if (filteredPairs.length !== selectedPairs.length) {
      setSelectedPairs(filteredPairs)
      setValue("selectedPairs", filteredPairs)
    }
  }, [generatePairs, selectedPairs, setValue])

  return (
    <>
      {/* Debug button - Remove in production */}
      {import.meta.env.DEV && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
          <p className="text-xs text-yellow-600 mb-2">🐛 Debug Mode</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🧪 Test button clicked')
              setIsDeploymentModalOpen(true)
            }}
          >
            Test Modal (Debug)
          </Button>
          <span className="text-xs ml-2 text-muted-foreground">
            Modal state: {isDeploymentModalOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      )}
      
      <DeploymentProgressModal
        isOpen={isDeploymentModalOpen}
        onClose={handleDeploymentModalClose}
        transactionFlow={transactionFlow}
        onComplete={handleDeploymentComplete}
      />
      
      <form onSubmit={handleSubmit(onSubmit, onSubmitError)} className="space-y-6 p-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{Math.round((currentStep / steps.length) * 100)}%</span>
        </div>
        <Progress value={(currentStep / steps.length) * 100} />
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vault Name *</Label>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground mb-1">
                {displayName}
              </div>
              <Input
                id="name"
                variant="glass"
                placeholder="Enter vault name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-error">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
              <Textarea
              id="description"
              variant="glass"
              placeholder="Describe your vault..."
              {...register("description")}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              variant="glass"
              type="url"
              placeholder="https://..."
              {...register("image")}
            />
          </div>
        </div>
      )}

      {/* Step 2: Fees */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depositFee">Deposit Fee (%)</Label>
            <Input
              id="depositFee"
              variant="glass"
              type="number"
              step="0.1"
              min="0"
              max="5"
              {...register("depositFee", { valueAsNumber: true })}
            />
            {errors.depositFee && (
              <p className="text-sm text-error">{errors.depositFee.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawFee">Withdraw Fee (%)</Label>
            <Input
              id="withdrawFee"
              variant="glass"
              type="number"
              step="0.1"
              min="0"
              max="5"
              {...register("withdrawFee", { valueAsNumber: true })}
            />
            {errors.withdrawFee && (
              <p className="text-sm text-error">{errors.withdrawFee.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="managementFee">Management Fee (%)</Label>
            <Input
              id="managementFee"
              variant="glass"
              type="number"
              step="0.1"
              min="0"
              max="2"
              {...register("managementFee", { valueAsNumber: true })}
            />
            {errors.managementFee && (
              <p className="text-sm text-error">{errors.managementFee.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="performanceFee">Performance Fee (%)</Label>
            <Input
              id="performanceFee"
              variant="glass"
              type="number"
              step="0.1"
              min="0"
              max="20"
              {...register("performanceFee", { valueAsNumber: true })}
            />
            {errors.performanceFee && (
              <p className="text-sm text-error">{errors.performanceFee.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Tokens */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Whitelisted Tokens *</Label>
            <div className="relative">
              <TokenSelector
                value={null}
                onChange={() => {}}
                showBalance={false}
                title="Select Tokens"
              selected={selectedTokens}
                onMultiChange={(tokens) => {
                setSelectedTokens(tokens)
                setValue("whitelistedTokens", tokens)
                  // Reset selected pairs when tokens change
                  setSelectedPairs([])
                  setValue("selectedPairs", [])
              }}
                className="w-full"
            />
            </div>
            {selectedTokens.length === 1 && (
              <div className="flex items-center gap-1.5 text-xs text-orange-500">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Please select at least 2 tokens to create pairs</span>
              </div>
            )}
            {errors.whitelistedTokens && (
              <p className="text-sm text-error">
                {errors.whitelistedTokens.message}
              </p>
            )}
          </div>

          {/* Selected tokens chips */}
          {selectedTokensInfo.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 glass rounded-lg">
              {selectedTokensInfo.map((token: any) => (
                <Badge
                  key={token.address}
                  variant="secondary"
                  className="glass flex items-center gap-1"
                >
                  {(token.logoURI || token.logoUrl) && (
                    <img
                      src={token.logoURI || token.logoUrl}
                      alt={token.symbol}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <span>{token.symbol}</span>
                  <button
                    onClick={() => toggleToken(token.address)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {generatePairs.length > 0 && (
            <div className="space-y-2">
              <Label>Available Pairs *</Label>
              <div className="relative">
                <PairSelector
                  pairs={generatePairs}
                  selected={selectedPairs}
                  onMultiChange={(pairs) => {
                    setSelectedPairs(pairs)
                    setValue("selectedPairs", pairs)
                  }}
                  className="w-full"
                  title="Select Pairs"
                />
              </div>
              {errors.selectedPairs && (
                <p className="text-sm text-error">
                  {errors.selectedPairs.message}
                </p>
              )}
              
              {/* Selected pairs chips */}
              {selectedPairs.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 glass rounded-lg">
                  {generatePairs
                    .filter((pair) => selectedPairs.some((sp) => sp.pairId === pair.id))
                    .map((pair) => {
                      const selectedPair = selectedPairs.find((sp) => sp.pairId === pair.id)
                      return (
                        <Badge
                          key={pair.id}
                          variant="secondary"
                          className="glass flex items-center gap-1.5"
                        >
                          {/* Token A */}
                          <div className="flex items-center gap-1">
                            {(pair.tokenA?.logoURI || pair.tokenA?.logoUrl) && (
                              <img
                                src={pair.tokenA.logoURI || pair.tokenA.logoUrl}
                                alt={pair.tokenA?.symbol || 'Token A'}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <span>{pair.tokenA?.symbol || 'Unknown'}</span>
                          </div>
                          <span className="text-muted-foreground">/</span>
                          {/* Token B */}
                          <div className="flex items-center gap-1">
                            {(pair.tokenB?.logoURI || pair.tokenB?.logoUrl) && (
                              <img
                                src={pair.tokenB.logoURI || pair.tokenB.logoUrl}
                                alt={pair.tokenB?.symbol || 'Token B'}
                                className="w-4 h-4 rounded-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <span>{pair.tokenB?.symbol || 'Unknown'}</span>
                          </div>
                          {selectedPair && selectedPair.fee > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({selectedPair.fee}%)
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const newPairs = selectedPairs.filter((sp) => sp.pairId !== pair.id)
                              setSelectedPairs(newPairs)
                              setValue("selectedPairs", newPairs)
                            }}
                            className="ml-1 hover:opacity-70"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card variant="glass" className="p-4">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p className="font-medium">{displayName}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="font-medium">{watch("description") || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fees:</span>
                <p className="font-medium">
                  Deposit: {watch("depositFee")}% | Withdraw: {watch("withdrawFee")}% | Management: {watch("managementFee")}% | Performance: {watch("performanceFee")}%
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tokens:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTokensInfo.map((token: any) => (
                    <Badge key={token.address} variant="secondary" className="flex items-center gap-1">
                      {(token.logoURI || token.logoUrl) && (
                        <img
                          src={token.logoURI || token.logoUrl}
                          alt={token.symbol}
                          className="w-4 h-4 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <span>{token.symbol}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Selected Pairs:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {generatePairs
                    .filter((pair) => selectedPairs.some((sp) => sp.pairId === pair.id))
                    .map((pair) => {
                      const selectedPair = selectedPairs.find((sp) => sp.pairId === pair.id)
                      return (
                        <Badge key={pair.id} variant="secondary" className="flex items-center gap-1">
                          <span>{pair.tokenA?.symbol || 'Unknown'}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{pair.tokenB?.symbol || 'Unknown'}</span>
                          {selectedPair && selectedPair.fee > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({selectedPair.fee}%)
                            </span>
                          )}
                        </Badge>
                      )
                    })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        {currentStep < steps.length ? (
          <Button 
            type="button" 
            variant="glass-apple" 
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !watchedName) ||
              (currentStep === 3 && (
                selectedTokens.length < 2 || 
                selectedPairs.length < 1 || 
                selectedPairs.some((sp) => sp.fee <= 0)
              ))
            }
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button 
            type="submit" 
            variant="glass-apple"
            onClick={(e) => {
              console.log('🖱️ Deploy Vault button clicked')
              console.log('📋 Current form values:', watch())
              console.log('❌ Current form errors:', errors)
            }}
          >
            Deploy Vault
          </Button>
        )}
      </div>
    </form>
    </>
  )
}

