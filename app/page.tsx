"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Menu, Shield, Zap, Target, User } from "lucide-react"
import { CompareModal } from "@/components/compare-modal"
import { MobileMenu } from "@/components/mobile-menu"
import { AuthModal } from "@/components/auth-modal"
import { LogoScrollWheel } from "@/components/logo-scroll-wheel"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// Animated counter component - Optimized
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return

    const duration = 2000 // 2 seconds
    const steps = 50 // Reduced for better performance
    const increment = target / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setCount(target)
        setIsComplete(true)
        clearInterval(timer)
      } else {
        setCount(Math.floor(increment * currentStep))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [target, isComplete])

  return <>{count.toLocaleString()}k+</>
}

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [vehicleCount, setVehicleCount] = useState(937) // Default to 937k (current count: 937,627 vehicles)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Fetch vehicle count from API - Once per day
  useEffect(() => {
    let isMounted = true
    const CACHE_KEY = 'carma_vehicle_count'
    const CACHE_TIMESTAMP_KEY = 'carma_vehicle_count_timestamp'
    const ONE_DAY_MS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    const fetchVehicleCount = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://carma-ml-api.greenwater-7817a41f.northeurope.azurecontainerapps.io'
        console.log('Fetching vehicle count from API:', `${API_BASE}/stats`)
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch(`${API_BASE}/stats`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('API response data:', data)
        
        // Convert to thousands (937,627 -> 937)
        if (data && typeof data.total_vehicles === 'number') {
          const count = Math.floor(data.total_vehicles / 1000)
          console.log('Calculated count (in thousands):', count, 'from', data.total_vehicles, 'vehicles')
          
          if (isMounted) {
            setVehicleCount(count)
            console.log('Vehicle count updated to:', count)
            
            // Cache the value and timestamp
            if (typeof window !== 'undefined') {
              localStorage.setItem(CACHE_KEY, count.toString())
              localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
              console.log('Cached value:', count)
            }
          }
        } else {
          console.error('Invalid API response format:', data)
          throw new Error('Invalid response format')
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Vehicle count fetch timed out')
        } else {
          console.error('Failed to fetch vehicle count:', error)
        }
        
        // Fall back to cache if fetch fails
        if (typeof window !== 'undefined') {
          const cachedCount = localStorage.getItem(CACHE_KEY)
          if (cachedCount) {
            const cachedValue = parseInt(cachedCount)
            console.log('Using cached value due to fetch error:', cachedValue)
            if (isMounted) {
              setVehicleCount(cachedValue)
            }
          }
        }
      }
    }

    // Check if we have cached data to show immediately while fetching
    if (typeof window !== 'undefined') {
      const cachedCount = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      
      if (cachedCount && cachedTimestamp) {
        const timeSinceLastFetch = Date.now() - parseInt(cachedTimestamp)
        const cachedValue = parseInt(cachedCount)
        
        console.log('Found cached count:', cachedValue, 'Age:', Math.floor(timeSinceLastFetch / (60 * 60 * 1000)), 'hours')
        
        // Use cached value immediately for fast UI
        setVehicleCount(cachedValue)
        
        // If cache is fresh (< 1 hour), still fetch in background but don't wait
        if (timeSinceLastFetch < 60 * 60 * 1000) {
          console.log('Cache is fresh, fetching in background...')
          // Still fetch to update cache, but don't block UI
          fetchVehicleCount().catch(() => {}) // Silently fail if background fetch fails
          return
        } else {
          console.log('Cache expired, fetching fresh data...')
        }
      } else {
        console.log('No cache found, fetching fresh data...')
      }
    }
    
    // Always try to fetch (will use cache as fallback if it fails)
    fetchVehicleCount()
    
    return () => {
      isMounted = false
    }
  }, [])

  const handleCompareClick = () => {
    if (!isAuthenticated) {
      setAuthMode("login")
      setIsAuthModalOpen(true)
      toast({
        title: "Sign In Required",
        description: "Please sign in to compare vehicles."
      })
      return
    }
    setIsCompareModalOpen(true)
  }

  const handlePriceAlertsClick = () => {
    if (!isAuthenticated) {
      setAuthMode("signup")
      setIsAuthModalOpen(true)
      toast({
        title: "Sign Up Required",
        description: "Please create an account to set up price alerts."
      })
      return
    }
    toast({
      title: "Price Alerts",
      description: "You can now set up price alerts from your account dashboard."
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger menu button - visible on all screen sizes */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Logo placeholder */}
            <div></div>
            
            {/* Auth button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-white/90">Welcome, {user?.email}</span>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/settings'}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Settings
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setAuthMode("login")
                  setIsAuthModalOpen(true)
                }}
                className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 rounded-[32px] shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="compare-section" className="py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Logo */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <img
                src="/carma-logo.png"
                alt="CARMA Logo"
                className="w-40 h-40 animate-spin-slow"
                loading="eager"
                decoding="sync"
              />
            </div>
          </div>

          {/* Main heading */}
          <div className="max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6">
              The complete platform to{" "}
              <span className="text-primary">compare vehicles</span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Your team&apos;s toolkit to stop searching and start comparing. Securely find, analyze, and track the best automotive deals with CARMA.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                size="lg"
                onClick={handleCompareClick}
                className="text-lg px-8 py-3"
              >
                Compare Vehicles
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3"
                onClick={handlePriceAlertsClick}
              >
                Price Alerts
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Paste any vehicle listing URL to get started
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 border-t border-border/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-primary mb-2">
                <AnimatedCounter target={vehicleCount} />
              </div>
              <div className="text-sm text-muted-foreground mb-1">vehicles tracked</div>
              <div className="text-xs text-muted-foreground">daily updates</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground mb-1">accuracy rate</div>
              <div className="text-xs text-muted-foreground">price predictions</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-primary mb-2">$2.5M</div>
              <div className="text-sm text-muted-foreground mb-1">saved by users</div>
              <div className="text-xs text-muted-foreground">in negotiations</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground mb-1">monitoring</div>
              <div className="text-xs text-muted-foreground">price changes</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-balance mb-6">
                Faster comparison. More savings.
              </h2>
              <p className="text-lg text-muted-foreground mb-8 text-balance">
                The platform for smart car shopping. Let your research focus on finding deals instead of managing spreadsheets with automated price tracking, built-in analytics, and integrated comparison tools.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">Verified dealer network</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">Real-time price updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">Smart matching algorithm</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Search Results</span>
                    <span className="text-xs text-primary">Live</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <div className="font-medium">2023 Tesla Model 3</div>
                        <div className="text-sm text-muted-foreground">Long Range AWD</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">$42,990</div>
                        <div className="text-xs text-gain">-$3,000</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <div className="font-medium">2023 BMW 330i</div>
                        <div className="text-sm text-muted-foreground">Sport Package</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">$45,200</div>
                        <div className="text-xs text-loss">+$1,200</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div>
                        <div className="font-medium">2023 Audi A4</div>
                        <div className="text-sm text-muted-foreground">Premium Plus</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">$43,800</div>
                        <div className="text-xs text-neutral">No change</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Scroll Wheel */}
      <section className="py-6 px-4 bg-background border-t border-border/20">
        <div className="container mx-auto">
          <LogoScrollWheel
            logos={[
              { src: '/AutoScout24_primary_solid.png', alt: 'AutoScout24', href: 'https://www.autoscout24.de' },
              { src: '/AutoTrader_logo.svg.png', alt: 'AutoTrader', href: 'https://www.autotrader.com' },
              { src: '/Logo_von_mobile.de_2025-05.svg.png', alt: 'Mobile.de', href: 'https://www.mobile.de' },
              { src: '/AutoScout24_primary_solid.png', alt: 'AutoScout24', href: 'https://www.autoscout24.de' },
              { src: '/AutoTrader_logo.svg.png', alt: 'AutoTrader', href: 'https://www.autotrader.com' },
              { src: '/Logo_von_mobile.de_2025-05.svg.png', alt: 'Mobile.de', href: 'https://www.mobile.de' },
            ]}
          />
        </div>
      </section>

      {/* Price Alerts Section */}
      <section id="price-alerts" className="py-20 px-4 bg-card/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-balance mb-6">
            Make car shopping seamless.{" "}
            <span className="text-primary">Tools for smart buyers</span>
          </h2>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto mb-12">
            Set up price alerts and get notified when when your dream car drops in price.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your email for price alerts..."
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    setAuthMode("signup")
                    setIsAuthModalOpen(true)
                  } else {
                    toast({
                      title: "Subscribed!",
                      description: "You'll receive price alerts at your email."
                    })
                  }
                }}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <CompareModal isOpen={isCompareModalOpen} onClose={() => setIsCompareModalOpen(false)} />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        mode={authMode}
      />
    </div>
  )
}
