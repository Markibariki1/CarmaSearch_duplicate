"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Calendar, Gauge, MapPin, FileText, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  trim?: string
  image: string
  currentValue: number
  originalPrice: number
  daysOwned: number
  lastUpdated: string
  mileage?: number
}

interface VehicleDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
}

const mockPriceHistory = [
  { month: "Jan", value: 55000 },
  { month: "Feb", value: 58000 },
  { month: "Mar", value: 62000 },
  { month: "Apr", value: 65000 },
  { month: "May", value: 67000 },
  { month: "Jun", value: 65000 },
]

const mockMaintenanceHistory = [
  { date: "2024-01-15", type: "Oil Change", cost: 120, mileage: 28000 },
  { date: "2023-11-20", type: "Brake Pads", cost: 850, mileage: 26500 },
  { date: "2023-08-10", type: "Tire Rotation", cost: 80, mileage: 25000 },
]

export function VehicleDetailsModal({ open, onOpenChange, vehicle }: VehicleDetailsModalProps) {
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [isLoadingAlert, setIsLoadingAlert] = useState(false)
  const [isLoadingDelete, setIsLoadingDelete] = useState(false)
  const { toast } = useToast()

  if (!vehicle) return null

  const gainLoss = vehicle.currentValue - vehicle.originalPrice
  const gainLossPercentage = ((gainLoss / vehicle.originalPrice) * 100).toFixed(1)
  const isGain = gainLoss >= 0

  const handleEdit = async () => {
    setIsLoadingEdit(true)
    console.log("[v0] Editing vehicle:", vehicle.id)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Edit Mode Activated",
        description: `You can now edit details for your ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
      })

      setIsLoadingEdit(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to enter edit mode. Please try again.",
        variant: "destructive",
      })
      setIsLoadingEdit(false)
    }
  }

  const handleSetAlert = async () => {
    setIsLoadingAlert(true)
    console.log("[v0] Setting price alert for vehicle:", vehicle.id)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Price Alert Set",
        description: `You'll be notified of price changes for your ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
      })

      setIsLoadingAlert(false)
    } catch (error) {
      toast({
        title: "Error Setting Alert",
        description: "Unable to set price alert. Please try again.",
        variant: "destructive",
      })
      setIsLoadingAlert(false)
    }
  }

  const handleDelete = async () => {
    setIsLoadingDelete(true)
    console.log("[v0] Deleting vehicle:", vehicle.id)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Vehicle Removed",
        description: `${vehicle.year} ${vehicle.make} ${vehicle.model} has been removed from your portfolio.`,
      })

      setIsLoadingDelete(false)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error Deleting Vehicle",
        description: "Unable to remove vehicle. Please try again.",
        variant: "destructive",
      })
      setIsLoadingDelete(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim && <span className="text-muted-foreground"> {vehicle.trim}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image and Basic Info */}
          <div className="space-y-4">
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={vehicle.image || "/placeholder.svg"}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge
                  variant={isGain ? "default" : "destructive"}
                  className={isGain ? "bg-gain text-white" : "bg-loss text-white"}
                >
                  {isGain ? "+" : ""}
                  {gainLossPercentage}%
                </Badge>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Current Value</p>
                <p className="text-2xl font-bold">${vehicle.currentValue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Original Price</p>
                <p className="text-2xl font-bold">${vehicle.originalPrice.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  {isGain ? (
                    <TrendingUp className="h-4 w-4 text-gain" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-loss" />
                  )}
                  <p className="text-sm text-muted-foreground">Gain/Loss</p>
                </div>
                <p className={`text-2xl font-bold ${isGain ? "text-gain" : "text-loss"}`}>
                  ${Math.abs(gainLoss).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Days Owned</p>
                </div>
                <p className="text-2xl font-bold">{vehicle.daysOwned}</p>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Vehicle Details</h3>
              <div className="space-y-2">
                {vehicle.mileage && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{vehicle.mileage.toLocaleString()} miles</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Last updated {vehicle.lastUpdated}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">VIN: WBA3B1C50DF123456</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Charts and History */}
          <div className="space-y-6">
            {/* Price History Chart */}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold mb-4">Price History</h3>
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockPriceHistory} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <Separator />

            {/* Maintenance History */}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold mb-4">Recent Maintenance</h3>
              <div className="space-y-3">
                {mockMaintenanceHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-4 bg-card border border-border rounded-lg min-w-0"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="font-medium truncate">{item.type}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {new Date(item.date).toLocaleDateString()} • {item.mileage.toLocaleString()} miles
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="font-semibold text-right">${item.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Market Insights */}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold mb-4">Market Insights</h3>
              <div className="space-y-3">
                <div className="p-4 bg-card border border-border rounded-lg min-w-0">
                  <p className="text-sm text-muted-foreground truncate">Average Market Price</p>
                  <p className="text-lg font-semibold truncate">$67,500</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg min-w-0">
                  <p className="text-sm text-muted-foreground truncate">Days on Market (Similar)</p>
                  <p className="text-lg font-semibold truncate">45 days</p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg min-w-0">
                  <p className="text-sm text-muted-foreground truncate">Price Trend (30 days)</p>
                  <p className="text-lg font-semibold text-gain truncate">+2.3%</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-border bg-background/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 min-w-0" onClick={handleEdit} disabled={isLoadingEdit || isLoadingAlert || isLoadingDelete}>
              {isLoadingEdit ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  <span className="truncate">Editing...</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Edit Vehicle</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-0 bg-transparent"
              onClick={handleSetAlert}
              disabled={isLoadingEdit || isLoadingAlert || isLoadingDelete}
            >
              {isLoadingAlert ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  <span className="truncate">Setting...</span>
                </>
              ) : (
                <span className="truncate">Set Price Alert</span>
              )}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive bg-transparent flex-shrink-0"
              onClick={handleDelete}
              disabled={isLoadingEdit || isLoadingAlert || isLoadingDelete}
            >
              {isLoadingDelete ? <LoadingSpinner size={16} /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
