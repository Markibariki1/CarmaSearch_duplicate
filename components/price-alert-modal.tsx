"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Search, Bell } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"

interface PriceAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PriceAlertModal({ open, onOpenChange }: PriceAlertModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [alertType, setAlertType] = useState<"buy" | "sell">("buy")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [condition, setCondition] = useState("below")
  const [frequency, setFrequency] = useState("daily")
  const { toast } = useToast()

  const mockSearchResults = [
    "2019 BMW M3 Competition",
    "2020 Porsche 911 Carrera S",
    "2021 Tesla Model S Plaid",
    "2022 Mercedes-AMG GT 63 S",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("[v0] Creating price alert:", {
      alertType,
      selectedVehicle,
      targetPrice,
      condition,
      frequency,
    })

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Price Alert Created",
        description: `You'll be notified when ${selectedVehicle} is ${condition} $${Number(targetPrice).toLocaleString()}.`,
      })

      setIsLoading(false)
      onOpenChange(false)
      // Reset form
      setSearchQuery("")
      setSelectedVehicle("")
      setTargetPrice("")
      setCondition("below")
      setFrequency("daily")
    } catch (error) {
      toast({
        title: "Error Creating Alert",
        description: "There was a problem creating your price alert. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg relative">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Set Price Alert
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size={32} />
              <p className="text-sm text-muted-foreground">Creating alert...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Type */}
          <div className="space-y-3">
            <Label>Alert Type</Label>
            <RadioGroup value={alertType} onValueChange={(value: "buy" | "sell") => setAlertType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy">Buy Alert - Notify when prices drop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell">Sell Alert - Notify when prices rise</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Vehicle Search */}
          <div className="space-y-3">
            <Label htmlFor="vehicle-search">Search Vehicle</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="vehicle-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by make, model, year..."
                className="pl-10"
              />
            </div>

            {searchQuery && (
              <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                {mockSearchResults
                  .filter((result) => result.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b border-border last:border-b-0"
                      onClick={() => {
                        setSelectedVehicle(result)
                        setSearchQuery(result)
                      }}
                    >
                      {result}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Target Price */}
          <div className="space-y-3">
            <Label htmlFor="target-price">Target Price</Label>
            <div className="flex gap-2">
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">Below</SelectItem>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="exactly">Exactly</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="target-price"
                type="number"
                min="0"
                step="1000"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="65000"
                className="flex-1"
                required
              />
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="space-y-3">
            <Label>Notification Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={!selectedVehicle || !targetPrice || isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Alert"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
