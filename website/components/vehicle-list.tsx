"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Eye, Edit, Trash2, Search, Filter, Plus } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { VehicleDetailsModal } from "./vehicle-details-modal"
import { SimpleAddVehicleModal } from "./simple-add-vehicle-modal"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

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

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    make: "BMW",
    model: "M3",
    year: 2019,
    trim: "Competition",
    image: "/2019-bmw-m3-competition-silver.jpg",
    currentValue: 65000,
    originalPrice: 55000,
    daysOwned: 847,
    lastUpdated: "2 hours ago",
    mileage: 28500,
  },
  {
    id: "2",
    make: "Porsche",
    model: "911",
    year: 2020,
    trim: "Carrera S",
    image: "/2020-porsche-911-carrera-s-white.jpg",
    currentValue: 98000,
    originalPrice: 105000,
    daysOwned: 623,
    lastUpdated: "1 day ago",
    mileage: 15200,
  },
  {
    id: "3",
    make: "Tesla",
    model: "Model S",
    year: 2021,
    trim: "Plaid",
    image: "/2021-tesla-model-s-plaid-black.jpg",
    currentValue: 85000,
    originalPrice: 120000,
    daysOwned: 456,
    lastUpdated: "3 hours ago",
    mileage: 22100,
  },
  {
    id: "4",
    make: "Mercedes-AMG",
    model: "GT",
    year: 2022,
    trim: "63 S",
    image: "/2022-mercedes-amg-gt-63-s-blue.jpg",
    currentValue: 145000,
    originalPrice: 135000,
    daysOwned: 234,
    lastUpdated: "5 hours ago",
    mileage: 8900,
  },
  {
    id: "5",
    make: "Audi",
    model: "RS6",
    year: 2020,
    trim: "Avant",
    image: "/2020-audi-rs6-avant-gray.jpg",
    currentValue: 78000,
    originalPrice: 82000,
    daysOwned: 512,
    lastUpdated: "1 day ago",
    mileage: 31200,
  },
  {
    id: "6",
    make: "Lamborghini",
    model: "Huracán",
    year: 2021,
    trim: "EVO",
    image: "/2021-lamborghini-huracan-evo-orange.jpg",
    currentValue: 235000,
    originalPrice: 210000,
    daysOwned: 389,
    lastUpdated: "4 hours ago",
    mileage: 12800,
  },
]

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  const gainLoss = vehicle.currentValue - vehicle.originalPrice
  const gainLossPercentage = ((gainLoss / vehicle.originalPrice) * 100).toFixed(1)
  const isGain = gainLoss >= 0

  const handleEdit = () => {
    toast({
      title: "Edit Vehicle",
      description: `Opening edit form for ${vehicle.year} ${vehicle.make} ${vehicle.model}...`,
    })
    setTimeout(() => {
      toast({
        title: "Edit Form Ready",
        description: "You can now update vehicle details, mileage, and condition.",
      })
    }, 1000)
  }

  const handleDelete = () => {
    toast({
      title: "Delete Vehicle",
      description: `Are you sure you want to remove ${vehicle.year} ${vehicle.make} ${vehicle.model} from your portfolio?`,
      action: (
        <ToastAction
          altText="Confirm Delete"
          onClick={() => {
            toast({
              title: "Vehicle Removed",
              description: `${vehicle.year} ${vehicle.make} ${vehicle.model} has been removed from your portfolio.`,
            })
          }}
        >
          Confirm Delete
        </ToastAction>
      ),
    })
  }

  return (
    <>
      <Card className="border-border/50 hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={
                vehicle.image ||
                `/placeholder.svg?height=200&width=400&query=${vehicle.year || "/placeholder.svg"} ${vehicle.make} ${vehicle.model}`
              }
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
            />
            <div className="absolute top-3 right-3">
              <Badge
                variant={isGain ? "default" : "destructive"}
                className={`${isGain ? "bg-gain text-white" : "bg-loss text-white"} whitespace-nowrap`}
              >
                {isGain ? "+" : ""}
                {gainLossPercentage}%
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              {vehicle.trim && <p className="text-sm text-muted-foreground">{vehicle.trim}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Current Value</p>
                <p className="font-semibold whitespace-nowrap">${vehicle.currentValue.toLocaleString()}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Original Price</p>
                <p className="font-semibold whitespace-nowrap">${vehicle.originalPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isGain ? <TrendingUp className="h-4 w-4 text-gain flex-shrink-0" /> : <TrendingDown className="h-4 w-4 text-loss flex-shrink-0" />}
                <span className={`${isGain ? "text-gain" : "text-loss"} whitespace-nowrap`}>${Math.abs(gainLoss).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground text-xs whitespace-nowrap">{vehicle.daysOwned} days</div>
            </div>

            {vehicle.mileage && (
              <div className="text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="whitespace-nowrap">{vehicle.mileage.toLocaleString()} miles</span>
                  <span className="whitespace-nowrap">Updated {vehicle.lastUpdated}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent text-xs"
                onClick={() => setDetailsOpen(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
              <Button size="sm" variant="outline" className="flex-1 bg-transparent text-xs" onClick={handleEdit}>
                <Edit className="h-3 w-3 mr-1" />
                Update
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive bg-transparent px-2"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <VehicleDetailsModal open={detailsOpen} onOpenChange={setDetailsOpen} vehicle={vehicle} />
    </>
  )
}

export function VehicleList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMake, setSelectedMake] = useState("all")
  const [sortBy, setSortBy] = useState("value-desc")
  const [visibleCount, setVisibleCount] = useState(6)
  const [addVehicleOpen, setAddVehicleOpen] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const { toast } = useToast()

  // Allow external triggers (e.g., from PortfolioSummary) to open this modal
  useEffect(() => {
    const handler = () => setAddVehicleOpen(true)
    window.addEventListener("open-add-vehicle", handler)
    return () => window.removeEventListener("open-add-vehicle", handler)
  }, [])

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6)
    toast({
      title: "Loading More Vehicles",
      description: "Fetching additional vehicles from your portfolio...",
    })
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value) {
      toast({
        title: "Searching Vehicles",
        description: `Filtering portfolio for "${value}"...`,
      })
    }
  }

  const handleVehicleAdded = (newVehicle: any) => {
    console.log("[v0] New vehicle added to portfolio:", newVehicle)
    const vehicleWithDefaults = {
      ...newVehicle,
      image: `/placeholder.svg?height=200&width=400&query=${newVehicle.year} ${newVehicle.make} ${newVehicle.model}`,
      currentValue: newVehicle.originalPrice, // Start with original price
      daysOwned: Math.floor((Date.now() - new Date(newVehicle.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)),
    }
    setVehicles((prev) => [vehicleWithDefaults, ...prev])
    toast({
      title: "Vehicle Added to Portfolio",
      description: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} is now visible in your portfolio below.`,
    })
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (selectedMake !== "all" && vehicle.make.toLowerCase() !== selectedMake.toLowerCase()) {
      return false
    }
    if (
      searchTerm &&
      !`${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const sortedVehicles = filteredVehicles.sort((a, b) => {
    switch (sortBy) {
      case "value-desc":
        return b.currentValue - a.currentValue
      case "value-asc":
        return a.currentValue - b.currentValue
      case "gain-desc":
        return b.currentValue - b.originalPrice - (a.currentValue - a.originalPrice)
      case "gain-asc":
        return a.currentValue - a.originalPrice - (b.currentValue - b.originalPrice)
      case "date-desc":
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case "date-asc":
        return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters - Removed duplicate Add Vehicle button */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Portfolio Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedMake} onValueChange={setSelectedMake}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Makes</SelectItem>
                  <SelectItem value="bmw">BMW</SelectItem>
                  <SelectItem value="porsche">Porsche</SelectItem>
                  <SelectItem value="tesla">Tesla</SelectItem>
                  <SelectItem value="mercedes">Mercedes</SelectItem>
                  <SelectItem value="audi">Audi</SelectItem>
                  <SelectItem value="lamborghini">Lamborghini</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                  <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                  <SelectItem value="gain-desc">Gain (High to Low)</SelectItem>
                  <SelectItem value="gain-asc">Loss (High to Low)</SelectItem>
                  <SelectItem value="date-desc">Recently Added</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedVehicles.slice(0, visibleCount).map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* Load More */}
      {visibleCount < sortedVehicles.length && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" size="lg" onClick={handleLoadMore}>
            Load More Vehicles ({sortedVehicles.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      <SimpleAddVehicleModal open={addVehicleOpen} onOpenChange={setAddVehicleOpen} onVehicleAdded={handleVehicleAdded} />
    </div>
  )
}
