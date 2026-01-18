"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface SimpleAddVehicleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVehicleAdded?: (vehicle: any) => void
}

export function SimpleAddVehicleModal({ open, onOpenChange, onVehicleAdded }: SimpleAddVehicleModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newVehicle = {
        id: Date.now().toString(),
        make: formData.make,
        model: formData.model,
        year: Number(formData.year),
        originalPrice: Number(formData.price),
        currentValue: Number(formData.price),
        daysOwned: 0,
        lastUpdated: "Just now",
        image: `/placeholder.svg?height=200&width=400&query=${formData.year} ${formData.make} ${formData.model}`,
      }

      toast({
        title: "Vehicle Added Successfully",
        description: `${formData.year} ${formData.make} ${formData.model} has been added to your portfolio.`,
      })

      onVehicleAdded?.(newVehicle)
      onOpenChange(false)
      
      // Reset form
      setFormData({ make: "", model: "", year: "", price: "" })
    } catch (error) {
      toast({
        title: "Error Adding Vehicle",
        description: "There was a problem adding your vehicle. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="BMW"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="M3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              placeholder="2023"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Purchase Price</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="65000"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Vehicle"}
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
