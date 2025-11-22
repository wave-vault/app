import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { variant?: "default" | "glass" }
>(({ className, variant = "default", ...props }, ref) => {
  const glassClasses = variant === "glass" 
    ? "glass border-white/20 focus-visible:border-white/40 focus-visible:glass-strong" 
    : "bg-transparent border-input"
  
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-2xl px-4 py-3 text-base shadow-md transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-2",
        glassClasses,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
