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

  // Debug log
  useEffect(() => {
    console.log('🎭 DeploymentProgressModal render:', { isOpen, isPending, isSuccess, isError, currentStepIndex })
  }, [isOpen, isPending, isSuccess, isError, currentStepIndex])

  // Auto-start when modal opens
  useEffect(() => {
    if (isOpen && !isPending && !isSuccess && !isError && currentStepIndex === -1) {
      console.log('▶️ Auto-starting deployment flow in 500ms...')
      setTimeout(() => {
        console.log('🚀 Starting deployment flow NOW')
        start()
      }, 500)
    }
  }, [isOpen, isPending, isSuccess, isError, currentStepIndex, start])

  // Call onComplete when done
  useEffect(() => {
    if (isSuccess && onComplete) {
      // Extract vault address from first step result
      const deployResult = steps[0]?.returnValue as any
      if (deployResult?.vaultAddress) {
        onComplete(deployResult.vaultAddress)
      }
    }
  }, [isSuccess, steps, onComplete])

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
            {(isSuccess || isError) && (
              <Button
                variant={isSuccess ? 'glass-apple' : 'outline'}
                onClick={handleClose}
              >
                {isSuccess ? 'View Vault' : 'Close'}
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

