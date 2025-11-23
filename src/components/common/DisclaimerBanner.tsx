import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const DISCLAIMER_STORAGE_KEY = "disclaimer-banner-dismissed"

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(DISCLAIMER_STORAGE_KEY)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true")
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <Card variant="glass" className="bg-destructive/10 border-destructive/20 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                Important Disclaimer
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              This project is currently in <strong className="text-foreground">beta</strong> and has <strong className="text-foreground">not been audited</strong>. 
              Use at your own risk. The code may contain bugs or vulnerabilities. 
              We do not guarantee the security or accuracy of the software.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-destructive/20"
            onClick={handleDismiss}
            aria-label="Dismiss disclaimer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

