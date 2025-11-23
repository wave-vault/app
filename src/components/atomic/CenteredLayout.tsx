import { cn } from "@/lib/utils"
import { Container } from "./Container"

interface CenteredLayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function CenteredLayout({ children, className, maxWidth = "2xl" }: CenteredLayoutProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center py-12", className)}>
      <Container maxWidth={maxWidth} className="w-full">
        {children}
      </Container>
    </div>
  )
}




