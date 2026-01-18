"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link as LinkIcon, ChevronDown, Star, TrendingUp, TrendingDown, ExternalLink, Loader2, Car, Calendar, Gauge, Euro, Palette, Target, ChevronRight, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { compareVehicle, formatDealScore, formatPrice, formatMileage, Vehicle, ComparablesResponse } from "@/lib/api"

interface CompareModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const [vehicleUrl, setVehicleUrl] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedExteriorColors, setSelectedExteriorColors] = useState<string[]>([])
  const [selectedInteriorColors, setSelectedInteriorColors] = useState<string[]>([])
  const [selectedInteriorMaterials, setSelectedInteriorMaterials] = useState<string[]>([])
  const [registrationFrom, setRegistrationFrom] = useState("")
  const [registrationUntil, setRegistrationUntil] = useState("")
  const [mileageFrom, setMileageFrom] = useState("")
  const [mileageUntil, setMileageUntil] = useState("")
  const [showExteriorColors, setShowExteriorColors] = useState(false)
  const [showInteriorColors, setShowInteriorColors] = useState(false)
  const [showInteriorMaterials, setShowInteriorMaterials] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ComparablesResponse | null>(null)
  const [error, setError] = useState<string>("")
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const activeRequest = useRef<AbortController | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    return () => {
      if (activeRequest.current) {
        activeRequest.current.abort()
        activeRequest.current = null
      }
    }
  }, [])

  const exteriorColors = ["Beige", "Blue", "Brown", "Bronze", "Yellow", "Gray", "Green", "Red", "Black", "Silver", "Purple", "White", "Orange", "Gold"]
  const interiorColors = ["Beige", "Black", "Gray", "Brown", "Other", "Blue", "Red", "Green", "Yellow", "Orange", "White"]
  const interiorMaterials = ["Alcantara", "Full Leather", "Partial Leather", "Fabric", "Other", "Velour"]
  const registrationYears = ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"]

  // Color mapping for swatches
  const getColorSwatch = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "Beige": "#F5F5DC",
      "Blue": "#0000FF", 
      "Brown": "#8B4513",
      "Bronze": "#CD7F32",
      "Yellow": "#FFFF00",
      "Gray": "#808080",
      "Green": "#008000",
      "Red": "#FF0000",
      "Black": "#000000",
      "Silver": "#C0C0C0",
      "Purple": "#800080",
      "White": "#FFFFFF",
      "Orange": "#FFA500",
      "Gold": "#FFD700",
      "Other": "#E0E0E0"
    }
    return colorMap[color] || "#E0E0E0"
  }

  const handleExteriorColorChange = (color: string, checked: boolean) => {
    if (checked) {
      setSelectedExteriorColors([...selectedExteriorColors, color])
    } else {
      setSelectedExteriorColors(selectedExteriorColors.filter((c) => c !== color))
    }
  }

  const handleInteriorColorChange = (color: string, checked: boolean) => {
    if (checked) {
      setSelectedInteriorColors([...selectedInteriorColors, color])
    } else {
      setSelectedInteriorColors(selectedInteriorColors.filter((c) => c !== color))
    }
  }

  const handleInteriorMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setSelectedInteriorMaterials([...selectedInteriorMaterials, material])
    } else {
      setSelectedInteriorMaterials(selectedInteriorMaterials.filter((m) => m !== material))
    }
  }

  const handleCompare = async () => {
    if (!vehicleUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a vehicle listing URL to compare.",
        variant: "destructive",
      })
      return
    }

    if (activeRequest.current) {
      activeRequest.current.abort()
      activeRequest.current = null
    }

    setIsSearching(true)
    setError("")

    const controller = new AbortController()
    activeRequest.current = controller

    try {
      const results = await compareVehicle(vehicleUrl.trim(), {
        top: 12,
        signal: controller.signal
      })

      setSearchResults(results)
      
      toast({
        title: "Comparison Complete!",
        description: `Found ${results.comparables.length} similar vehicles using CARMA's AI matching.`,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      
      toast({
        title: "Comparison Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
      }
      setIsSearching(false)
    }
  }

  const handleSaveAndCompare = () => {
    handleCompare()
  }

  useEffect(() => {
    if (!isOpen) {
      setVehicleUrl("")
      setShowAdvanced(false)
      setSelectedExteriorColors([])
      setSelectedInteriorColors([])
      setSelectedInteriorMaterials([])
      setRegistrationFrom("")
      setRegistrationUntil("")
      setMileageFrom("")
      setMileageUntil("")
      setShowExteriorColors(false)
      setShowInteriorColors(false)
      setShowInteriorMaterials(false)
      setIsSearching(false)
      setError("")
      setIsDescriptionExpanded(false)
      setSearchResults(null)
      if (activeRequest.current) {
        activeRequest.current.abort()
        activeRequest.current = null
      }
    }
  }, [isOpen])

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const filteredComparables = useMemo(() => {
    if (!searchResults) {
      return []
    }

    return searchResults.comparables.filter((vehicle) => {
      if (selectedExteriorColors.length > 0 && !selectedExteriorColors.includes(vehicle.exterior_color || "Other")) {
        return false
      }
      if (selectedInteriorColors.length > 0 && !selectedInteriorColors.includes(vehicle.interior_color || "Other")) {
        return false
      }
      if (selectedInteriorMaterials.length > 0 && !selectedInteriorMaterials.includes(vehicle.upholstery_color || "Other")) {
        return false
      }
      if (registrationFrom && vehicle.year < parseInt(registrationFrom)) {
        return false
      }
      if (registrationUntil && vehicle.year > parseInt(registrationUntil)) {
        return false
      }
      if (mileageFrom && vehicle.mileage_km < parseInt(mileageFrom)) {
        return false
      }
      if (mileageUntil && vehicle.mileage_km > parseInt(mileageUntil)) {
        return false
      }
      return true
    })
  }, [
    searchResults,
    selectedExteriorColors,
    selectedInteriorColors,
    selectedInteriorMaterials,
    registrationFrom,
    registrationUntil,
    mileageFrom,
    mileageUntil
  ])

  // Limit displayed comparables to prevent memory issues
  const comparablesToDisplay = useMemo(() => {
    const maxDisplay = 12
    return filteredComparables.slice(0, maxDisplay).map((vehicle, index) => ({
      ...vehicle,
      displayIndex: index
    }))
  }, [filteredComparables])

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-white/10">
        <DialogHeader className="border-b border-white/10 pb-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Vehicle Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* URL Input Section */}
          <div className="space-y-4">
            <Label htmlFor="vehicle-url" className="text-white/90 text-sm font-medium">Vehicle Listing URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                id="vehicle-url"
                type="url"
                placeholder="Paste AutoScout24 vehicle listing URL (e.g., https://www.autoscout24.de/angebote/...)"
                value={vehicleUrl}
                onChange={(e) => setVehicleUrl(e.target.value)}
                className="pl-12 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl h-14 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-0"
                disabled={isSearching}
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-white/60 hover:text-white p-0"
            >
              Advanced Options
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <Card className="p-6 space-y-6 bg-black/30 backdrop-blur-sm border border-white/10">
              <div className="space-y-6">
                {/* First Registration Range - Moved to Top */}
                <div className="space-y-3">
                  <Label className="text-white/90 font-semibold">First Registration</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="registration-from" className="text-sm text-white/70">From</Label>
                      <Select value={registrationFrom} onValueChange={setRegistrationFrom}>
                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                          <SelectValue placeholder="From" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          {registrationYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="registration-until" className="text-sm text-white/70">Until</Label>
                      <Select value={registrationUntil} onValueChange={setRegistrationUntil}>
                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                          <SelectValue placeholder="Until" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                          {registrationYears.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Mileage Range - Moved to Top */}
                <div className="space-y-3">
                  <Label className="text-white/90 font-semibold">Mileage</Label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="mileage-from" className="text-sm text-white/70">From</Label>
                      <div className="relative">
                        <Input
                          id="mileage-from"
                          type="number"
                          placeholder="From"
                          value={mileageFrom}
                          onChange={(e) => setMileageFrom(e.target.value)}
                          className="bg-black/40 border-white/10 text-white pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 text-sm">km</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="mileage-until" className="text-sm text-white/70">Until</Label>
                      <div className="relative">
                        <Input
                          id="mileage-until"
                          type="number"
                          placeholder="Until"
                          value={mileageUntil}
                          onChange={(e) => setMileageUntil(e.target.value)}
                          className="bg-black/40 border-white/10 text-white pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 text-sm">km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exterior Color - Expandable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 font-semibold">Exterior Color</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExteriorColors(!showExteriorColors)}
                      className="text-white/70 hover:text-white"
                    >
                      {showExteriorColors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showExteriorColors && (
                    <div className="grid grid-cols-4 gap-2">
                      {exteriorColors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exterior-${color}`}
                            checked={selectedExteriorColors.includes(color)}
                            onCheckedChange={(checked) => handleExteriorColorChange(color, checked as boolean)}
                            className="border-white/20"
                          />
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border border-white/20" 
                              style={{ backgroundColor: getColorSwatch(color) }}
                            />
                            <Label htmlFor={`exterior-${color}`} className="text-sm text-white/80">
                              {color}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interior Color - Expandable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 font-semibold">Interior Color</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInteriorColors(!showInteriorColors)}
                      className="text-white/70 hover:text-white"
                    >
                      {showInteriorColors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showInteriorColors && (
                    <div className="grid grid-cols-4 gap-2">
                      {interiorColors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`interior-${color}`}
                            checked={selectedInteriorColors.includes(color)}
                            onCheckedChange={(checked) => handleInteriorColorChange(color, checked as boolean)}
                            className="border-white/20"
                          />
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border border-white/20" 
                              style={{ backgroundColor: getColorSwatch(color) }}
                            />
                            <Label htmlFor={`interior-${color}`} className="text-sm text-white/80">
                              {color}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>

                {/* Interior Material - Expandable */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/90 font-semibold">Interior Material</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInteriorMaterials(!showInteriorMaterials)}
                      className="text-white/70 hover:text-white"
                    >
                      {showInteriorMaterials ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showInteriorMaterials && (
                    <div className="grid grid-cols-3 gap-2">
                      {interiorMaterials.map((material) => (
                        <div key={material} className="flex items-center space-x-2">
                          <Checkbox
                            id={`material-${material}`}
                            checked={selectedInteriorMaterials.includes(material)}
                            onCheckedChange={(checked) => handleInteriorMaterialChange(material, checked as boolean)}
                            className="border-white/20"
                          />
                          <Label htmlFor={`material-${material}`} className="text-sm text-white/80">
                            {material}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveAndCompare} 
                  disabled={isSearching}
                  className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl px-6 py-2"
                >
                  {isSearching ? "Searching..." : "Save & Compare"}
                </Button>
              </div>
            </Card>
          )}

          {/* Simple Compare Button */}
          {!showAdvanced && (
            <div className="flex justify-center">
              <Button 
                onClick={handleCompare} 
                disabled={isSearching} 
                size="lg"
                className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl px-8 py-3 text-lg"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Vehicle...
                  </>
                ) : (
                  "Compare with CARMA AI"
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400 text-sm font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-8">
              {/* Original Vehicle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Selected Vehicle
                  </h3>
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Original</Badge>
                </div>
                
                <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
                  <div className="flex gap-6">
                    {/* Left side - Image */}
                    <div className="flex-shrink-0">
                      {searchResults.vehicle.images && searchResults.vehicle.images.length > 0 && (
                        <img 
                          src={searchResults.vehicle.images[0]} 
                          alt={`${searchResults.vehicle.make} ${searchResults.vehicle.model}`}
                          className="w-80 h-48 object-cover rounded-xl shadow-lg"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    {/* Right side - Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-2xl font-bold text-white mb-4">
                        {searchResults.vehicle.make} {searchResults.vehicle.model}
                      </h4>
                      
                      {/* Quick Snapshot */}
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
                        <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          Quick Snapshot
                        </h5>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">First Registration:</span>
                              <div className="font-medium text-white">{searchResults.vehicle.year}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">Mileage:</span>
                              <div className="font-medium text-white">{formatMileage(searchResults.vehicle.mileage_km)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">Price:</span>
                              <div className="font-medium text-white text-lg">{formatPrice(searchResults.vehicle.price_eur)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">Deal Score:</span>
                              <div className={`font-medium ${formatDealScore(searchResults.vehicle.deal_score).class}`}>
                            {formatDealScore(searchResults.vehicle.deal_score).text}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">Exterior Color:</span>
                              <div className="font-medium text-white">{searchResults.vehicle.exterior_color || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-white/60" />
                            <div>
                              <span className="text-white/60">Interior:</span>
                              <div className="font-medium text-white">{searchResults.vehicle.upholstery_color || searchResults.vehicle.interior_color || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-white/80 mb-4">
                        <p><strong className="text-white">Fuel Type:</strong> {searchResults.vehicle.fuel_group}</p>
                        <p><strong className="text-white">Transmission:</strong> {searchResults.vehicle.transmission_group}</p>
                        <p><strong className="text-white">Body Type:</strong> {searchResults.vehicle.body_group}</p>
                        {searchResults.vehicle.power_kw && (
                          <p><strong className="text-white">Power:</strong> {searchResults.vehicle.power_kw} kW</p>
                        )}
                        <p><strong className="text-white">Predicted Fair Price:</strong> {formatPrice(searchResults.vehicle.price_hat)}</p>
                      </div>

                      {/* Expandable Description */}
                      {searchResults.vehicle.description && (
                        <div className="mb-4">
                          <button
                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            className="flex items-center gap-2 text-white font-medium hover:text-primary transition-colors mb-2"
                          >
                            Description:
                            <ChevronRight 
                              className={`h-4 w-4 transition-transform ${isDescriptionExpanded ? 'rotate-90' : ''}`} 
                            />
                          </button>
                          <div className={`overflow-hidden transition-all duration-300 ${
                            isDescriptionExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <p className="text-sm text-white/70 leading-relaxed">
                              {searchResults.vehicle.description}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <a 
                        href={searchResults.vehicle.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        View on AutoScout24
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Comparable Vehicles */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Similar Vehicles Found
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {filteredComparables.length} results
                    </Badge>
                    {searchResults.metadata && (
                      <span className="text-xs text-white/50">
                        Requested top {searchResults.metadata.requested_top}, ranked {searchResults.metadata.returned} of {searchResults.metadata.total_candidates} candidates
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {comparablesToDisplay.map((vehicle, index) => {
                    const dealScore = formatDealScore(vehicle.deal_score)
                    const similarityScore = typeof vehicle.similarity_score === 'number'
                      ? vehicle.similarity_score
                      : typeof vehicle.score === 'number'
                        ? vehicle.score
                        : undefined
                    const finalScore = typeof vehicle.final_score === 'number'
                      ? vehicle.final_score
                      : similarityScore
                    const preferenceScore = typeof vehicle.preference_score === 'number'
                      ? vehicle.preference_score
                      : undefined
                    const matchPercentage = finalScore !== undefined ? (finalScore * 100).toFixed(1) : null
                    const similarityPercentage = similarityScore !== undefined ? Math.round(similarityScore * 100) : null
                    const preferencePercentage = preferenceScore !== undefined ? Math.round(preferenceScore * 100) : null
                    let dealPercent: number | null = null
                    if (typeof vehicle.deal_score === 'number') {
                      let normalized = vehicle.deal_score
                      if (normalized >= 0 && normalized <= 1) {
                        normalized = (normalized - 0.5) * 100
                      } else {
                        normalized = normalized * 100
                      }
                      dealPercent = Math.round(normalized)
                    }
                    const filterLevel = vehicle.ranking_details?.filter_level
                    return (
                      <Card key={vehicle.id} className="p-4 hover:shadow-lg transition-all duration-300 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            {vehicle.images && vehicle.images.length > 0 ? (
                              <img 
                                src={vehicle.images[0]} 
                                alt={`${vehicle.make} ${vehicle.model}`}
                                className="w-28 h-20 object-cover rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-28 h-20 bg-white/10 rounded-lg flex items-center justify-center" style={{display: vehicle.images && vehicle.images.length > 0 ? 'none' : 'flex'}}>
                              <Car className="h-8 w-8 text-white/40" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white truncate text-lg">
                                  {vehicle.make} {vehicle.model}
                                </h4>
                                <p className="text-sm text-white/70 mb-2">
                                  {vehicle.year} • {vehicle.fuel_group} • {vehicle.transmission_group}
                                </p>
                                <p className="text-sm text-white/70 mb-2">
                                  {vehicle.body_group} • {formatMileage(vehicle.mileage_km)}
                                </p>
                                <p className="text-sm text-white/70">
                                  {vehicle.exterior_color || 'N/A'} exterior • {vehicle.upholstery_color || vehicle.interior_color || 'N/A'} interior
                                </p>
                                {vehicle.power_kw && (
                                  <p className="text-sm text-white/70">
                                    {vehicle.power_kw} kW
                                  </p>
                                )}
                              </div>

                              <div className="text-right ml-4">
                              <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "bg-primary/20 text-primary border-primary/30" : "bg-white/10 text-white border-white/20"}>
                                    #{index + 1}
                                  </Badge>
                                  {filterLevel ? (
                                    <Badge variant="outline" className="border-white/10 bg-transparent text-white/70">
                                      L{filterLevel}
                                    </Badge>
                                  ) : null}
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-primary" />
                                    <span className="text-xs text-white/60">
                                      {matchPercentage ?? 'N/A'}% match
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-2">
                                  <div className="text-xl font-bold text-primary">
                                    {formatPrice(vehicle.price_eur)}
                                  </div>
                                  <div className="text-sm text-white/60">
                                    Fair: {formatPrice(vehicle.price_hat)}
                                  </div>
                                  <div className={`text-xs font-medium ${dealScore.class}`}>
                                    {dealScore.text}
                                  </div>
                                  <div className="text-xs text-white/50 space-x-2">
                                    {similarityPercentage !== null && (
                                      <span>Sim {similarityPercentage}%</span>
                                    )}
                                    {dealPercent !== null && (
                                      <span>Deal {dealPercent > 0 ? '+' : ''}{dealPercent}%</span>
                                    )}
                                    {preferencePercentage !== null && preferencePercentage > 0 && (
                                      <span>Pref {preferencePercentage}%</span>
                                    )}
                                  </div>
                                  {typeof vehicle.savings === 'number' && vehicle.savings > 0 && (
                                    <div className="text-xs text-emerald-400">
                                      Saves {formatPrice(vehicle.savings)}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <a 
                                    href={vehicle.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                  >
                                    View Listing
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
