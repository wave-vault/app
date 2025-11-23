import { Container } from "@/components/atomic/Container"
import { Heart, AlertTriangle, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import logoImage from "@/logo/logo.png"

export function ThanksSection() {
  return (
    <section id="thanks-section" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background via-aqua-500/5 to-aqua-500/10 w-full relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-aqua-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-aqua-600/20 rounded-full blur-3xl"></div>
      </div>

      <Container maxWidth="full" className="w-full relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-8 space-y-12">
          {/* Logo and Main Thanks Message */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-black dark:text-white font-bold text-4xl sm:text-5xl md:text-6xl leading-none flex items-center">
                1
              </span>
              <img
                src={logoImage}
                alt="Wave Logo"
                className="h-12 sm:h-16 md:h-20 w-auto animate-pulse"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-aqua-500 to-foreground bg-clip-text text-transparent">
                Thank You for Learning About 1 Wave
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                We hope you enjoyed exploring the future of liquidity! 🌊
              </p>
              <p className="text-base sm:text-lg text-muted-foreground/80">
                See you soon! 🚀
              </p>
            </div>
          </div>

          {/* Credits Card */}
          <Card variant="glass" className="p-8 sm:p-10 border-aqua-500/20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-aqua-500" />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Made with
                </p>
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  by
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                <a
                  href="https://andrea0x.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-lg sm:text-xl font-semibold text-aqua-500 hover:text-aqua-400 transition-all duration-300 hover:scale-110 inline-flex items-center gap-2"
                >
                  <span className="underline decoration-2 underline-offset-4 decoration-aqua-500/50 group-hover:decoration-aqua-400">
                    Andrea0x.eth
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
                <span className="text-muted-foreground/50 hidden sm:inline text-2xl">•</span>
                <a
                  href="https://turinglabs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-lg sm:text-xl font-semibold text-aqua-500 hover:text-aqua-400 transition-all duration-300 hover:scale-110 inline-flex items-center gap-2"
                >
                  <span className="underline decoration-2 underline-offset-4 decoration-aqua-500/50 group-hover:decoration-aqua-400">
                    Turinglabs.eth
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </a>
              </div>
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Card variant="glass" className="bg-destructive/5 border-destructive/20 p-6 text-left">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <Badge variant="destructive" className="mb-2">
                    Important Disclaimer
                  </Badge>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    This project is currently in <strong className="text-foreground">beta</strong> and has <strong className="text-foreground">not been audited</strong>. 
                    Use at your own risk. The code may contain bugs or vulnerabilities. 
                    We do not guarantee the security or accuracy of the software.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  )
}

