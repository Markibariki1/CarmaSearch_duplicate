"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { TrendingUp, TrendingDown, Bell, BellRing, AlertTriangle, Info, Star, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface MarketTrend {
  id: string
  make: string
  model: string
  year: number
  trend: "up" | "down"
  percentage: number
  reason: string
}

interface PriceAlert {
  id: string
  vehicle: string
  type: "above" | "below"
  targetPrice: number
  currentPrice: number
  isActive: boolean
  createdAt: string
}

interface MarketInsight {
  id: string
  type: "recommendation" | "warning" | "info"
  title: string
  description: string
  action?: string
}

const trendingVehicles: MarketTrend[] = [
  {
    id: "1",
    make: "Porsche",
    model: "911 GT3",
    year: 2022,
    trend: "up",
    percentage: 12.5,
    reason: "Limited production run announced",
  },
  {
    id: "2",
    make: "BMW",
    model: "M3 Competition",
    year: 2021,
    trend: "up",
    percentage: 8.3,
    reason: "High demand in collector market",
  },
  {
    id: "3",
    make: "Tesla",
    model: "Model S Plaid",
    year: 2021,
    trend: "down",
    percentage: -5.2,
    reason: "New model refresh announced",
  },
  {
    id: "4",
    make: "Mercedes-AMG",
    model: "GT 63 S",
    year: 2020,
    trend: "up",
    percentage: 6.7,
    reason: "Strong performance in auctions",
  },
]

const priceAlerts: PriceAlert[] = [
  {
    id: "1",
    vehicle: "2019 BMW M3 Competition",
    type: "above",
    targetPrice: 70000,
    currentPrice: 65000,
    isActive: true,
    createdAt: "2 days ago",
  },
  {
    id: "2",
    vehicle: "2020 Porsche 911 Carrera S",
    type: "below",
    targetPrice: 95000,
    currentPrice: 98000,
    isActive: true,
    createdAt: "1 week ago",
  },
  {
    id: "3",
    vehicle: "2021 Tesla Model S Plaid",
    type: "below",
    targetPrice: 80000,
    currentPrice: 85000,
    isActive: false,
    createdAt: "3 days ago",
  },
]

const marketInsights: MarketInsight[] = [
  {
    id: "1",
    type: "recommendation",
    title: "Consider Selling Tesla Model S",
    description: "Market analysis suggests Tesla values may decline 10-15% due to upcoming refresh.",
    action: "View Details",
  },
  {
    id: "2",
    type: "warning",
    title: "High Mileage Impact",
    description: "Your 2020 Audi RS6 has exceeded average mileage for the year, potentially affecting resale value.",
    action: "Update Listing",
  },
  {
    id: "3",
    type: "info",
    title: "Market Opportunity",
    description: "Luxury SUV market showing strong growth. Consider diversifying your portfolio.",
    action: "Explore Options",
  },
]

function TrendingCard({ trend }: { trend: MarketTrend }) {
  const isUp = trend.trend === "up"

  return (
    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          {trend.year} {trend.make} {trend.model}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{trend.reason}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {isUp ? <TrendingUp className="h-4 w-4 text-gain" /> : <TrendingDown className="h-4 w-4 text-loss" />}
        <span className={`text-sm font-medium whitespace-nowrap ${isUp ? "text-gain" : "text-loss"}`}>
          {isUp ? "+" : ""}
          {trend.percentage}%
        </span>
      </div>
    </div>
  )
}

function AlertCard({ alert }: { alert: PriceAlert }) {
  const [isActive, setIsActive] = useState(alert.isActive)
  const { toast } = useToast()

  const isTriggered =
    alert.type === "above" ? alert.currentPrice >= alert.targetPrice : alert.currentPrice <= alert.targetPrice

  const handleToggleAlert = (checked: boolean) => {
    setIsActive(checked)
    toast({
      title: checked ? "Alert Activated" : "Alert Deactivated",
      description: `Price alert for ${alert.vehicle} has been ${checked ? "activated" : "deactivated"}.`,
    })
  }

  const handleAlertClick = () => {
    if (isTriggered) {
      toast({
        title: "Alert Triggered!",
        description: `${alert.vehicle} has reached your target price of $${alert.targetPrice.toLocaleString()}`,
      })
    } else {
      toast({
        title: "Alert Details",
        description: `Monitoring ${alert.vehicle} for price ${alert.type} $${alert.targetPrice.toLocaleString()}`,
      })
    }
  }

  return (
    <div
      className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
      onClick={handleAlertClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm truncate">{alert.vehicle}</p>
          {isTriggered && (
            <Badge variant="default" className="bg-automotive-accent text-white text-xs animate-pulse flex-shrink-0">
              Triggered
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Alert when {alert.type} ${alert.targetPrice.toLocaleString()} • Created {alert.createdAt}
        </p>
        <p className="text-sm text-muted-foreground">Current: ${alert.currentPrice.toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
        <Switch checked={isActive} onCheckedChange={handleToggleAlert} />
        {isActive ? (
          <BellRing className="h-4 w-4 text-automotive-accent" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

function InsightCard({ insight }: { insight: MarketInsight }) {
  const { toast } = useToast()
  const [isDismissed, setIsDismissed] = useState(false)

  const getIcon = () => {
    switch (insight.type) {
      case "recommendation":
        return <Star className="h-4 w-4 text-automotive-accent flex-shrink-0" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-automotive-loss flex-shrink-0" />
      case "info":
        return <Info className="h-4 w-4 text-automotive-neutral flex-shrink-0" />
    }
  }

  const getBorderColor = () => {
    switch (insight.type) {
      case "recommendation":
        return "border-l-automotive-accent"
      case "warning":
        return "border-l-automotive-loss"
      case "info":
        return "border-l-automotive-neutral"
    }
  }

  const handleActionClick = () => {
    toast({
      title: "Action Triggered",
      description: `${insight.action} for: ${insight.title}`,
    })

    if (insight.type === "recommendation" && insight.title.includes("Tesla")) {
      setTimeout(() => {
        toast({
          title: "Market Analysis",
          description: "Opening detailed Tesla market analysis and selling recommendations...",
        })
      }, 1000)
    } else if (insight.type === "warning" && insight.title.includes("Mileage")) {
      setTimeout(() => {
        toast({
          title: "Vehicle Update",
          description: "Opening vehicle details to update mileage and condition...",
        })
      }, 1000)
    } else if (insight.type === "info" && insight.title.includes("Market Opportunity")) {
      setTimeout(() => {
        toast({
          title: "Portfolio Suggestions",
          description: "Loading luxury SUV investment opportunities...",
        })
      }, 1000)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    toast({
      title: "Insight Dismissed",
      description: `"${insight.title}" has been removed from your insights.`,
    })
  }

  if (isDismissed) return null

  return (
    <div
      className={`p-4 border border-border/50 border-l-4 ${getBorderColor()} rounded-lg hover:border-primary/50 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
          <div className="flex gap-2">
            {insight.action && (
              <Button size="sm" variant="outline" className="text-sm h-8 bg-transparent" onClick={handleActionClick}>
                {insight.action}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="text-sm h-8 text-muted-foreground" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MarketInsights() {
  const { toast } = useToast()
  const [showAllTrends, setShowAllTrends] = useState(false)

  const handleViewAllTrends = () => {
    setShowAllTrends(!showAllTrends)
    toast({
      title: "Market Trends",
      description: showAllTrends ? "Showing condensed view" : "Showing all market trends and analysis...",
    })
  }

  const handleNewAlert = () => {
    toast({
      title: "New Price Alert",
      description: "Opening price alert creation form...",
    })
    setTimeout(() => {
      toast({
        title: "Alert Form Ready",
        description: "Select a vehicle and set your target price to create a new alert.",
      })
    }, 1500)
  }

  const handleViewHistory = () => {
    toast({
      title: "Loading Insight History",
      description: "Retrieving your previous market insights and recommendations...",
    })
    setTimeout(() => {
      toast({
        title: "History Loaded",
        description: "Found 23 previous insights from the last 30 days.",
      })
    }, 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Market Trends */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Trending in your portfolio categories</p>
              <Button size="sm" variant="outline" onClick={handleViewAllTrends}>
                {showAllTrends ? "Show Less" : "View All"}
              </Button>
            </div>
            {trendingVehicles.slice(0, showAllTrends ? trendingVehicles.length : 3).map((trend) => (
              <TrendingCard key={trend.id} trend={trend} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Alerts */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {priceAlerts.filter((a) => a.isActive).length} active alerts
              </p>
              <Button size="sm" variant="outline" onClick={handleNewAlert}>
                <Bell className="h-4 w-4 mr-1" />
                New Alert
              </Button>
            </div>
            {priceAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">AI-powered recommendations for your portfolio</p>
              <Button size="sm" variant="outline" onClick={handleViewHistory}>
                <Clock className="h-4 w-4 mr-1" />
                History
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
