"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ImageIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"

interface AddVehicleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVehicleAdded?: (vehicle: any) => void
}

export function AddVehicleModal({ open, onOpenChange, onVehicleAdded }: AddVehicleModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    trim: "",
    mileage: "",
    originalPrice: "",
    purchaseDate: "",
    vin: "",
    notes: "",
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setUploadedImages((prev) => [...prev, ...files].slice(0, 5)) // Max 5 images
      toast({
        title: "Images Added",
        description: `${files.length} image(s) uploaded successfully.`,
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("[v0] Adding vehicle:", formData)
    console.log("[v0] Uploaded images:", uploadedImages.length)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const newVehicle = {
        id: Date.now().toString(),
        make: formData.make,
        model: formData.model,
        year: Number.parseInt(formData.year),
        trim: formData.trim,
        mileage: formData.mileage ? Number.parseInt(formData.mileage) : undefined,
        originalPrice: Number.parseInt(formData.originalPrice),
        purchaseDate: formData.purchaseDate,
        vin: formData.vin,
        notes: formData.notes,
        images: uploadedImages,
        currentValue: Number.parseInt(formData.originalPrice),
        daysOwned: 0,
        lastUpdated: "Just now",
      }

      toast({
        title: "Vehicle Added Successfully",
        description: `${formData.year} ${formData.make} ${formData.model} has been added to your portfolio and will appear below.`,
      })

      onVehicleAdded?.(newVehicle)

      setIsLoading(false)
      onOpenChange(false)
      setFormData({
        make: "",
        model: "",
        year: "",
        trim: "",
        mileage: "",
        originalPrice: "",
        purchaseDate: "",
        vin: "",
        notes: "",
      })
      setUploadedImages([])
    } catch (error) {
      toast({
        title: "Error Adding Vehicle",
        description: "There was a problem adding your vehicle. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <LoadingSpinner size={32} />
              <p className="text-sm text-muted-foreground">Adding vehicle to your portfolio...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Select value={formData.make} onValueChange={(value) => setFormData({ ...formData, make: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audi">Audi</SelectItem>
                    <SelectItem value="bmw">BMW</SelectItem>
                    <SelectItem value="ferrari">Ferrari</SelectItem>
                    <SelectItem value="lamborghini">Lamborghini</SelectItem>
                    <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                    <SelectItem value="porsche">Porsche</SelectItem>
                    <SelectItem value="tesla">Tesla</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., M3, 911, Model S"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max="2025"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2023"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trim">Trim/Variant</Label>
                <Input
                  id="trim"
                  value={formData.trim}
                  onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                  placeholder="e.g., Competition, Turbo S"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Purchase Price *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="65000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileage">Current Mileage</Label>
                <Input
                  id="mileage"
                  type="number"
                  min="0"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="25000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={17}
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photos</h3>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                id="vehicle-images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="vehicle-images" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Drag and drop photos here, or click to browse</p>
                <p className="text-xs text-muted-foreground mb-4">Upload up to 5 images (JPG, PNG, WebP)</p>
                <Button type="button" variant="outline" size="sm">
                  Choose Files
                </Button>
              </label>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this vehicle..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Adding...
                </>
              ) : (
                "Add Vehicle"
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
