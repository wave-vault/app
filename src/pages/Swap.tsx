import { SwapInterface } from "@/components/swap/SwapInterface"
import { Card } from "@/components/ui/card"
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner"

export function Swap() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-[480px] md:max-w-[480px]">
          <Card 
            variant="glass-apple" 
            className="w-full rounded-3xl overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50"
          >
            <div className="p-6 md:p-8">
              <SwapInterface />
            </div>
          </Card>
        </div>
      </div>
      <DisclaimerBanner />
    </>
  )
}
