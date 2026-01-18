"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Link, Car, DollarSign, MapPin, Calendar, Palette, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PriceAlert {
  id: string
  type: 'vehicle' | 'custom'
  title: string
  vehicleUrl?: string
  make?: string
  model?: string
  year?: string
  maxPrice?: number
  minPrice?: number
  location?: string
  maxMileage?: number
  fuelType?: string
  transmission?: string
  bodyType?: string
  exteriorColor?: string
  interiorColor?: string
  interiorMaterial?: string
  drivetrain?: string
  engineType?: string
  features?: string[]
  isActive: boolean
  createdAt: Date
}

interface AddAlertModalProps {
  isOpen: boolean
  onClose: () => void
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void
}

export function AddAlertModal({ isOpen, onClose, onAddAlert }: AddAlertModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [alertType, setAlertType] = useState<'vehicle' | 'custom'>('vehicle')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    vehicleUrl: '',
    make: '',
    model: '',
    year: '',
    maxPrice: '',
    minPrice: '',
    location: '',
    maxMileage: '',
    fuelType: '',
    transmission: '',
    bodyType: '',
    exteriorColor: '',
    interiorColor: '',
    interiorMaterial: '',
    drivetrain: '',
    engineType: '',
    isActive: true
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newAlert = {
      type: alertType,
      title: formData.title || `${formData.year} ${formData.make} ${formData.model}`,
      vehicleUrl: formData.vehicleUrl || undefined,
      make: formData.make || undefined,
      model: formData.model || undefined,
      year: formData.year || undefined,
      maxPrice: formData.maxPrice ? parseInt(formData.maxPrice) : undefined,
      minPrice: formData.minPrice ? parseInt(formData.minPrice) : undefined,
      location: formData.location || undefined,
      maxMileage: formData.maxMileage ? parseInt(formData.maxMileage) : undefined,
      fuelType: formData.fuelType || undefined,
      transmission: formData.transmission || undefined,
      bodyType: formData.bodyType || undefined,
      exteriorColor: formData.exteriorColor || undefined,
      interiorColor: formData.interiorColor || undefined,
      interiorMaterial: formData.interiorMaterial || undefined,
      drivetrain: formData.drivetrain || undefined,
      engineType: formData.engineType || undefined,
      isActive: formData.isActive
    }

    onAddAlert(newAlert)
    
    toast({
      title: "Price Alert Created",
      description: "Your price alert has been successfully created.",
    })

    // Reset form
    setFormData({
      title: '',
      vehicleUrl: '',
      make: '',
      model: '',
      year: '',
      maxPrice: '',
      minPrice: '',
      location: '',
      maxMileage: '',
      fuelType: '',
      transmission: '',
      bodyType: '',
      exteriorColor: '',
      interiorColor: '',
      interiorMaterial: '',
      drivetrain: '',
      engineType: '',
      isActive: true
    })

    setIsLoading(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Price Alert
          </DialogTitle>
          <DialogDescription>
            Set up alerts to get notified when vehicle prices change or new matches are found.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Alert Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  alertType === 'vehicle' 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setAlertType('vehicle')}
              >
                <CardContent className="p-4 text-center">
                  <Link className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">Vehicle Link</div>
                  <div className="text-sm text-muted-foreground">Monitor a specific vehicle</div>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  alertType === 'custom' 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setAlertType('custom')}
              >
                <CardContent className="p-4 text-center">
                  <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">Custom Search</div>
                  <div className="text-sm text-muted-foreground">Set your own criteria</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {alertType === 'vehicle' ? (
            /* Vehicle Link Form */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleUrl">Vehicle URL</Label>
                <Input
                  id="vehicleUrl"
                  type="url"
                  placeholder="https://example.com/vehicle-listing"
                  value={formData.vehicleUrl}
                  onChange={(e) => handleInputChange('vehicleUrl', e.target.value)}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Alert Name (Optional)</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="My Dream Car Alert"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                />
              </div>
            </div>
          ) : (
            /* Custom Search Form */
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Alert Name</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Tesla Model 3 Under $40k"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                  required
                />
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Basic Information
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      type="text"
                      placeholder="Tesla"
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      type="text"
                      placeholder="Model 3"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="text"
                      placeholder="2023"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price ($)</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="50000"
                      value={formData.maxPrice}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMileage">Max Mileage</Label>
                    <Input
                      id="maxMileage"
                      type="number"
                      placeholder="50000"
                      value={formData.maxMileage}
                      onChange={(e) => handleInputChange('maxMileage', e.target.value)}
                      className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0 text-base transition-all duration-200 hover:bg-black/30 focus:bg-black/30"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Vehicle Specifications */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Vehicle Specifications
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select value={formData.fuelType} onValueChange={(value) => handleInputChange('fuelType', value)}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyType">Body Type</Label>
                    <Select value={formData.bodyType} onValueChange={(value) => handleInputChange('bodyType', value)}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="coupe">Coupe</SelectItem>
                        <SelectItem value="convertible">Convertible</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="hatchback">Hatchback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drivetrain">Drivetrain</Label>
                    <Select value={formData.drivetrain} onValueChange={(value) => handleInputChange('drivetrain', value)}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fwd">Front-Wheel Drive</SelectItem>
                        <SelectItem value="rwd">Rear-Wheel Drive</SelectItem>
                        <SelectItem value="awd">All-Wheel Drive</SelectItem>
                        <SelectItem value="4wd">4-Wheel Drive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="engineType">Engine Type</Label>
                    <Select value={formData.engineType} onValueChange={(value) => handleInputChange('engineType', value)}>
                      <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v6">V6</SelectItem>
                        <SelectItem value="v8">V8</SelectItem>
                        <SelectItem value="v4">4-Cylinder</SelectItem>
                        <SelectItem value="electric">Electric Motor</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Advanced Options
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-10 px-4 hover:bg-black/30 text-white font-medium transition-all duration-300"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted/20 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="exteriorColor">Exterior Color</Label>
                        <Select value={formData.exteriorColor} onValueChange={(value) => handleInputChange('exteriorColor', value)}>
                          <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="black">Black</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="gray">Gray</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="yellow">Yellow</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                            <SelectItem value="brown">Brown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interiorColor">Interior Color</Label>
                        <Select value={formData.interiorColor} onValueChange={(value) => handleInputChange('interiorColor', value)}>
                          <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="black">Black</SelectItem>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="gray">Gray</SelectItem>
                            <SelectItem value="brown">Brown</SelectItem>
                            <SelectItem value="tan">Tan</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interiorMaterial">Interior Material</Label>
                      <Select value={formData.interiorMaterial} onValueChange={(value) => handleInputChange('interiorMaterial', value)}>
                        <SelectTrigger className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 text-white focus:border-white/30 focus:ring-0">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leather">Leather</SelectItem>
                          <SelectItem value="cloth">Cloth</SelectItem>
                          <SelectItem value="synthetic">Synthetic</SelectItem>
                          <SelectItem value="alcantara">Alcantara</SelectItem>
                          <SelectItem value="premium-leather">Premium Leather</SelectItem>
                          <SelectItem value="nappa-leather">Nappa Leather</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Alert Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Alert Settings</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Enable Alert</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for this alert
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
              {isLoading ? "Creating..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
