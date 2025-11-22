import { useCallback, useEffect, useMemo, useState } from 'react'

export type TransactionFlowStep<Params> = {
  title: string
  execute: (params: Params, prevStepReturnValue?: any) => Promise<unknown>
}

export type TransactionFlowStatusStep = {
  title: string
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  returnValue: unknown
}

export type TransactionFlowStatus = {
  steps: TransactionFlowStatusStep[]
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  message: string
  currentStepIndex: number
}

export type TransactionFlowExecuteParams<Params> = {
  steps: TransactionFlowStep<Params>[]
  executeParams: Params
}

export function useTransactionFlow<TXFlowExecuteParams>({
  steps,
  executeParams,
}: TransactionFlowExecuteParams<TXFlowExecuteParams>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  const initialStatus = useMemo(
    () => ({
      steps: steps.map((step) => ({
        title: step.title,
        isPending: false,
        isSuccess: false,
        isError: false,
        returnValue: undefined as unknown,
      })),
      isPending: false,
      isSuccess: false,
      isError: false,
      message: '',
      currentStepIndex: -1,
    }),
    [steps]
  )

  const [status, setStatus] = useState<TransactionFlowStatus>(initialStatus)

  const execute = useCallback(
    async (stepIndex: number) => {
      const step = steps[stepIndex]
      if (!step) return false

      try {
        setStatus((prev) => ({
          ...prev,
          message: '',
          isPending: true,
          isSuccess: false,
          isError: false,
          currentStepIndex: stepIndex,
          steps: prev.steps.map((s, i) =>
            i === stepIndex
              ? {
                  ...s,
                  isPending: true,
                  isSuccess: false,
                  isError: false,
                }
              : s
          ),
        }))

        const prevStepReturnValue = stepIndex > 0 ? status.steps[stepIndex - 1]?.returnValue : undefined
        const res = await step.execute(executeParams, prevStepReturnValue)

        setStatus((prev) => ({
          ...prev,
          steps: prev.steps.map((s, i) =>
            i === stepIndex
              ? {
                  ...s,
                  isPending: false,
                  isSuccess: true,
                  isError: false,
                  returnValue: res,
                }
              : s
          ),
        }))

        // Move to next step or complete
        if (stepIndex < steps.length - 1) {
          setCurrentStepIndex(stepIndex + 1)
        } else {
          setStatus((prev) => ({
            ...prev,
            isPending: false,
            isSuccess: true,
            isError: false,
          }))
        }

        return true
      } catch (error) {
        const e = error as Error
        console.error('Transaction flow error:', e)
        
        setStatus((prev) => ({
          ...prev,
          message: e.message
            ? e.message.length > 150
              ? `${e.message.slice(0, 150)}...`
              : e.message
            : 'An error occurred. Please try again.',
          isPending: false,
          isSuccess: false,
          isError: true,
          steps: prev.steps.map((s, i) =>
            i === stepIndex
              ? {
                  ...s,
                  isPending: false,
                  isSuccess: false,
                  isError: true,
                }
              : s
          ),
        }))

        return false
      }
    },
    [steps, executeParams, status.steps]
  )

  const start = useCallback(() => {
    if (status.isPending || status.isSuccess || status.isError) {
      return
    }
    setCurrentStepIndex(0)
  }, [status.isPending, status.isSuccess, status.isError])

  const retry = useCallback(() => {
    if (status.isPending) return
    
    const failedStepIndex = status.steps.findIndex(step => step.isError)
    if (failedStepIndex !== -1) {
      setCurrentStepIndex(failedStepIndex)
    }
  }, [status.isPending, status.steps])

  const reset = useCallback(() => {
    setCurrentStepIndex(-1)
    setStatus(initialStatus)
  }, [initialStatus])

  // Execute current step when index changes
  useEffect(() => {
    if (currentStepIndex >= 0 && currentStepIndex < steps.length && !status.isError) {
      execute(currentStepIndex)
    }
  }, [currentStepIndex, steps.length, status.isError])

  // Update the steps when they change
  useEffect(() => {
    if (steps.length !== status.steps.length) {
      reset()
    }
  }, [reset, status.steps.length, steps.length])

  return {
    start,
    retry,
    reset,
    ...status,
  }
}

