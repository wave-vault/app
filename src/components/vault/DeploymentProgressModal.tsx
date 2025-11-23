import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react'
import { TransactionFlowStatus } from '@/hooks/useTransactionFlow'

export interface DeploymentProgressModalProps {
  isOpen: boolean
  onClose: () => void
  transactionFlow: TransactionFlowStatus & {
    start: () => void
    retry: () => void
    reset: () => void
  }
  onComplete?: (vaultAddress: string) => void
}

export function DeploymentProgressModal({
  isOpen,
  onClose,
  transactionFlow,
  onComplete,
}: DeploymentProgressModalProps) {
  const { steps, isPending, isSuccess, isError, message, start, retry, reset, currentStepIndex } =
    transactionFlow

  const completedSteps = steps.filter((s) => s.isSuccess).length
  const totalSteps = steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  // Auto-start when modal opens
  useEffect(() => {
    if (isOpen && !isPending && !isSuccess && !isError && currentStepIndex === -1) {
      setTimeout(() => {
        start()
      }, 500)
    }
  }, [isOpen, isPending, isSuccess, isError, currentStepIndex, start])

  // Extract vault address from deployment result
  const vaultAddress = steps[0]?.returnValue as any
  const vaultAddressStr = vaultAddress?.vaultAddress || vaultAddress?.address || ''

  // Call onComplete when done (with delay to show success message)
  useEffect(() => {
    if (isSuccess && onComplete && vaultAddressStr) {
      // Wait a bit to show success message before redirecting
      const timer = setTimeout(() => {
        onComplete(vaultAddressStr)
      }, 3000) // 3 seconds to show success message
      return () => clearTimeout(timer)
    }
  }, [isSuccess, vaultAddressStr, onComplete])

  const handleClose = () => {
    if (!isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] glass border-glass">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isPending && 'Deploying Your Vault...'}
            {isSuccess && '✅ Vault Deployed Successfully!'}
            {isError && '❌ Deployment Failed'}
            {!isPending && !isSuccess && !isError && 'Deploy Vault'}
          </DialogTitle>
          <DialogDescription>
            {isPending && 'Please confirm all transactions in your wallet'}
            {isSuccess && 'Your vault is now live and ready to receive deposits'}
            {isError && 'An error occurred during deployment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {Math.max(0, currentStepIndex + 1)} of {totalSteps}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCurrent = index === currentStepIndex
              const isCompleted = step.isSuccess
              const isFailed = step.isError
              const isPending = step.isPending

              return (
                <div
                  key={step.title}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? 'bg-primary/10 border border-primary/20'
                      : isCompleted
                        ? 'bg-success/5'
                        : isFailed
                          ? 'bg-error/5'
                          : 'bg-muted/30'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isPending && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    {isFailed && <XCircle className="h-5 w-5 text-error" />}
                    {!isPending && !isCompleted && !isFailed && (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-success'
                            : isFailed
                              ? 'text-error'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    {isPending && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Waiting for confirmation...
                      </p>
                    )}
                    {isCompleted && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Completed
                      </p>
                    )}
                    {isFailed && (
                      <p className="text-xs text-error mt-0.5">
                        Failed - Click retry to try again
                      </p>
                    )}
                  </div>

                  {/* Step Number */}
                  <div className="text-sm text-muted-foreground">
                    {index + 1}/{totalSteps}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Success Message with Vault Details */}
          {isSuccess && vaultAddressStr && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success mb-2">Deployment Successful!</p>
                <div className="space-y-2 text-xs text-success/80">
                  <p><strong>Vault Address:</strong></p>
                  <p className="font-mono break-all bg-black/20 p-2 rounded">{vaultAddressStr}</p>
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                    <p className="text-blue-300 font-medium">ℹ️ Note:</p>
                    <p className="text-blue-200/80 mt-1">
                      Your vault is being indexed by the subgraph. It will appear in the vaults list shortly. 
                      You'll be redirected to the Swap page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && message && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">Error</p>
                <p className="text-xs text-error/80 mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {isError && (
              <Button
                variant="glass-apple"
                onClick={retry}
                disabled={isPending}
              >
                Retry
              </Button>
            )}
            {isSuccess && (
              <Button
                variant="glass-apple"
                onClick={() => {
                  if (vaultAddressStr && onComplete) {
                    onComplete(vaultAddressStr)
                  } else {
                    handleClose()
                  }
                }}
              >
                Go to Swap
              </Button>
            )}
            {isError && (
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
            )}
            {isPending && (
              <Button variant="outline" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

