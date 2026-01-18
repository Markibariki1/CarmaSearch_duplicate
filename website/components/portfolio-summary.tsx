"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Car, Plus, Bell, Download } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { useState } from "react"
import { SimpleAddVehicleModal } from "./simple-add-vehicle-modal"
import { PriceAlertModal } from "./price-alert-modal"
import { useToast } from "@/hooks/use-toast"

const timeFrameData = {
  "1M": [
    { date: "Dec 1", value: 265000, change: 0 },
    { date: "Dec 8", value: 267000, change: 2000 },
    { date: "Dec 15", value: 264000, change: -3000 },
    { date: "Dec 22", value: 268000, change: 4000 },
    { date: "Dec 29", value: 271000, change: 3000 },
  ],
  "3M": [
    { date: "Oct", value: 245000, change: 0 },
    { date: "Nov", value: 252000, change: 7000 },
    { date: "Dec", value: 268000, change: 16000 },
    { date: "Jan", value: 271000, change: 3000 },
  ],
  "6M": [
    { date: "Jul", value: 235000, change: 0 },
    { date: "Aug", value: 241000, change: 6000 },
    { date: "Sep", value: 238000, change: -3000 },
    { date: "Oct", value: 245000, change: 7000 },
    { date: "Nov", value: 252000, change: 7000 },
    { date: "Dec", value: 268000, change: 16000 },
    { date: "Jan", value: 271000, change: 3000 },
  ],
  "1Y": [
    { date: "Jan 2024", value: 220000, change: 0 },
    { date: "Mar 2024", value: 225000, change: 5000 },
    { date: "May 2024", value: 235000, change: 10000 },
    { date: "Jul 2024", value: 235000, change: 0 },
    { date: "Sep 2024", value: 238000, change: 3000 },
    { date: "Nov 2024", value: 252000, change: 14000 },
    { date: "Jan 2025", value: 271000, change: 19000 },
  ],
  ALL: [
    { date: "2020", value: 180000, change: 0 },
    { date: "2021", value: 195000, change: 15000 },
    { date: "2022", value: 210000, change: 15000 },
    { date: "2023", value: 235000, change: 25000 },
    { date: "2024", value: 252000, change: 17000 },
    { date: "2025", value: 271000, change: 19000 },
  ],
}

const vehicleData = [
  { make: "BMW", model: "M3", year: 2022, purchasePrice: 65000, currentValue: 68000, gain: 3000, gainPercent: 4.6 },
  {
    make: "Porsche",
    model: "911",
    year: 2021,
    purchasePrice: 95000,
    currentValue: 102000,
    gain: 7000,
    gainPercent: 7.4,
  },
  {
    make: "Tesla",
    model: "Model S",
    year: 2023,
    purchasePrice: 85000,
    currentValue: 78000,
    gain: -7000,
    gainPercent: -8.2,
  },
  {
    make: "Ferrari",
    model: "F8",
    year: 2020,
    purchasePrice: 280000,
    currentValue: 295000,
    gain: 15000,
    gainPercent: 5.4,
  },
]

export function PortfolioSummary() {
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)
  const [priceAlertOpen, setPriceAlertOpen] = useState(false)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<keyof typeof timeFrameData>("6M")
  const { toast } = useToast()

  const totalValue = 268000
  const totalInvested = 245000
  const gainLoss = totalValue - totalInvested
  const gainLossPercentage = ((gainLoss / totalInvested) * 100).toFixed(1)
  const isGain = gainLoss >= 0

  const currentPerformanceData = timeFrameData[selectedTimeFrame]

  // Calculate dynamic Y-axis values based on data range
  const getYAxisValues = () => {
    const values = currentPerformanceData.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    const padding = range * 0.1 // 10% padding
    
    const minValue = Math.floor((min - padding) / 1000) * 1000
    const maxValue = Math.ceil((max + padding) / 1000) * 1000
    const step = Math.ceil((maxValue - minValue) / 5 / 1000) * 1000
    
    const ticks = []
    for (let i = minValue; i <= maxValue; i += step) {
      ticks.push(i)
    }
    return ticks
  }

  const yAxisTicks = getYAxisValues()

  const handleExportPortfolio = () => {
    console.log("[v0] Exporting portfolio to Excel")

    // Create comprehensive vehicle data with additional details
    const exportData = vehicleData.map((vehicle, index) => ({
      "Vehicle ID": `V${String(index + 1).padStart(3, "0")}`,
      Make: vehicle.make,
      Model: vehicle.model,
      Year: vehicle.year,
      "Purchase Price": vehicle.purchasePrice,
      "Current Value": vehicle.currentValue,
      "Gain/Loss Amount": vehicle.gain,
      "Gain/Loss Percentage": `${vehicle.gainPercent}%`,
      "Purchase Date": new Date(
        2023 - (4 - index),
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      ).toLocaleDateString(),
      "Last Updated": new Date().toLocaleDateString(),
      "Market Trend": vehicle.gain >= 0 ? "Appreciating" : "Depreciating",
      "Investment Category":
        vehicle.purchasePrice > 100000 ? "Luxury" : vehicle.purchasePrice > 50000 ? "Premium" : "Standard",
      "Estimated Annual Appreciation": `${(vehicle.gainPercent / 2).toFixed(1)}%`,
    }))

    // Add portfolio summary row
    const summaryRow = {
      "Vehicle ID": "TOTAL",
      Make: "Portfolio Summary",
      Model: `${vehicleData.length} Vehicles`,
      Year: new Date().getFullYear(),
      "Purchase Price": totalInvested,
      "Current Value": totalValue,
      "Gain/Loss Amount": gainLoss,
      "Gain/Loss Percentage": `${gainLossPercentage}%`,
      "Purchase Date": "Various",
      "Last Updated": new Date().toLocaleDateString(),
      "Market Trend": isGain ? "Positive" : "Negative",
      "Investment Category": "Mixed Portfolio",
      "Estimated Annual Appreciation": `${(Number.parseFloat(gainLossPercentage) / 2).toFixed(1)}%`,
    }

    const allData = [...exportData, summaryRow]

    // Create CSV content with proper formatting
    const headers = Object.keys(allData[0])
    const csvContent = [
      `"CARMA Portfolio Export - ${new Date().toLocaleDateString()}"`,
      `"Generated at: ${new Date().toLocaleString()}"`,
      "",
      headers.map((header) => `"${header}"`).join(","),
      ...allData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            if (typeof value === "number") {
              return value
            }
            return `"${value}"`
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `CARMA_Portfolio_Detailed_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Portfolio Exported Successfully",
      description: `Detailed portfolio data with ${vehicleData.length} vehicles exported to CSV file.`,
    })
  }

  const handleVehicleAdded = (newVehicle: any) => {
    console.log("[v0] New vehicle added to portfolio:", newVehicle)
    toast({
      title: "Vehicle Added to Portfolio",
      description: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} is now visible in your portfolio below.`,
    })
  }

  return (
    <div className="space-y-4">
      {/* Performance Metrics Card - Removed header and reduced padding */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-4">
          {/* Key Metrics - Better formatted */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl lg:text-3xl font-bold whitespace-nowrap">${totalValue.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Invested</p>
              <p className="text-2xl lg:text-3xl font-bold whitespace-nowrap">${totalInvested.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gain/Loss</p>
              <div className="flex items-center gap-2">
                {isGain ? <TrendingUp className="h-5 w-5 text-gain flex-shrink-0" /> : <TrendingDown className="h-5 w-5 text-loss flex-shrink-0" />}
                <div className="min-w-0">
                  <p className={`text-2xl lg:text-3xl font-bold whitespace-nowrap ${isGain ? "text-gain" : "text-loss"}`}>
                    ${Math.abs(gainLoss).toLocaleString()}
                  </p>
                  <span className={`text-sm whitespace-nowrap ${isGain ? "text-gain" : "text-loss"}`}>
                    ({isGain ? "+" : "-"}{gainLossPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Frame Buttons - Moved below metrics */}
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(timeFrameData).map((timeFrame) => (
              <Button
                key={timeFrame}
                variant={selectedTimeFrame === timeFrame ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeFrame(timeFrame as keyof typeof timeFrameData)}
                className={selectedTimeFrame === timeFrame ? "" : "bg-transparent"}
              >
                {timeFrame}
              </Button>
            ))}
          </div>

          {/* Chart - Enhanced with better context and grid lines */}
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#404040" 
                  strokeOpacity={0.6}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--foreground))" }}
                  tickLine={{ stroke: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--foreground))" }}
                  tickLine={{ stroke: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={[yAxisTicks[0], yAxisTicks[yAxisTicks.length - 1]]}
                  ticks={yAxisTicks}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name, props) => {
                    const change = props.payload?.change || 0
                    const changeText =
                      change >= 0 ? `+$${change.toLocaleString()}` : `-$${Math.abs(change).toLocaleString()}`
                    const changeColor = change >= 0 ? "hsl(var(--automotive-gain))" : "hsl(var(--automotive-loss))"
                    return [
                      <div key="tooltip">
                        <div className="font-semibold">${value.toLocaleString()}</div>
                        <div style={{ color: changeColor, fontSize: "12px" }}>{changeText} change</div>
                      </div>,
                      "Portfolio Value",
                    ]
                  }}
                />
                <ReferenceLine y={totalInvested} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={4}
                  dot={(props: any) => {
                    const { payload, key, cx, cy } = props
                    const change = payload?.change || 0
                    const color = change >= 0 ? "hsl(var(--automotive-gain))" : change < 0 ? "hsl(var(--automotive-loss))" : "#FFFFFF"
                    return <circle key={key} cx={cx} cy={cy} fill={color} stroke="#FFFFFF" strokeWidth={3} r={6} />
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Date labels below the graph for better context */}
          <div className="flex justify-between text-xs text-muted-foreground px-4">
            {currentPerformanceData.map((dataPoint, index) => (
              <span key={index} className="text-center">
                {dataPoint.date}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card - Simplified and reduced padding */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button className="flex items-center gap-2 h-12 justify-center whitespace-nowrap" onClick={() => setAddVehicleOpen(true)}>
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="min-w-0">Add Vehicle</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 bg-transparent justify-center whitespace-nowrap"
              onClick={() => {
                setPriceAlertOpen(true)
                setTimeout(() => {
                  window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "smooth",
                  })
                }, 100)
              }}
            >
              <Bell className="h-4 w-4 flex-shrink-0" />
              <span className="min-w-0">Set Price Alert</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 bg-transparent justify-center whitespace-nowrap"
              onClick={handleExportPortfolio}
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="min-w-0">Export Portfolio</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Components */}
      <SimpleAddVehicleModal open={addVehicleOpen} onOpenChange={setAddVehicleOpen} onVehicleAdded={handleVehicleAdded} />
      <PriceAlertModal open={priceAlertOpen} onOpenChange={setPriceAlertOpen} />
    </div>
  )
}
