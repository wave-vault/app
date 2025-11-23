import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
}

export function Container({ children, className, maxWidth = "2xl" }: ContainerProps) {
  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}




