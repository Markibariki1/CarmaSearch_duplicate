"use client"

import { PortfolioSummary } from "@/components/portfolio-summary"
import { VehicleList } from "@/components/vehicle-list"
import { MarketInsights } from "@/components/market-insights"
import { TrendingUp, DollarSign } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Image src="/carma-logo.png" alt="CARMA" width={24} height={24} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Vehicle Portfolio</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Track and manage your automotive investments</p>
              </div>
            </Link>

            {/* Quick Stats in Header - Made more compact */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-center min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <DollarSign className="h-3 w-3" />
                  Total Value
                </div>
                <div className="text-lg font-bold text-foreground whitespace-nowrap">$268,000</div>
              </div>
              <div className="text-center min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <TrendingUp className="h-3 w-3" />
                  Total Gain
                </div>
                <div className="text-lg font-bold text-gain whitespace-nowrap">+$23,000</div>
              </div>
              <div className="text-center min-w-0">
                <div className="text-xs text-muted-foreground">Vehicles</div>
                <div className="text-lg font-bold text-foreground">12</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Reorganized Layout */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Top Section - Portfolio Performance (Full Width) */}
        <div className="w-full">
          <PortfolioSummary />
        </div>

        {/* Middle Section - Vehicle List (Full Width) */}
        <div className="w-full">
          <VehicleList />
        </div>

        {/* Bottom Section - Market Insights and Price Alerts (Side by Side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <MarketInsights />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image src="/carma-logo.png" alt="CARMA" width={16} height={16} />
              <span>CARMA Portfolio Dashboard</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Last updated: 2 hours ago</span>
              <span>•</span>
              <span>Market data by AutoTrader & KBB</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
