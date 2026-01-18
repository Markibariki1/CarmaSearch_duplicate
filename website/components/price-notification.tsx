"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrendingDown, TrendingUp, Car, DollarSign, MapPin, X, Bell, MoreVertical, Edit, Trash2, Archive, Share } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PriceNotification {
  id: string
  alertId: string
  type: 'price_drop' | 'price_increase' | 'new_match' | 'vehicle_sold'
  title: string
  description: string
  vehicleInfo: {
    make: string
    model: string
    year: string
    price: number
    previousPrice?: number
    location?: string
    mileage?: number
    imageUrl?: string
  }
  alertTitle: string
  createdAt: Date
  isRead: boolean
  isArchived?: boolean
  isStarred?: boolean
}

interface PriceNotificationProps {
  notification: PriceNotification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
  onUpdateNotification: (id: string, updates: Partial<PriceNotification>) => void
}

export function PriceNotification({ notification, onMarkAsRead, onDismiss, onUpdateNotification }: PriceNotificationProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'price_drop':
        return <TrendingDown className="h-5 w-5 text-green-500" />
      case 'price_increase':
        return <TrendingUp className="h-5 w-5 text-red-500" />
      case 'new_match':
        return <Car className="h-5 w-5 text-blue-500" />
      case 'vehicle_sold':
        return <X className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'price_drop':
        return 'border-green-500/20 bg-green-500/5'
      case 'price_increase':
        return 'border-red-500/20 bg-red-500/5'
      case 'new_match':
        return 'border-blue-500/20 bg-blue-500/5'
      case 'vehicle_sold':
        return 'border-gray-500/20 bg-gray-500/5'
      default:
        return 'border-primary/20 bg-primary/5'
    }
  }

  const getNotificationBadge = () => {
    switch (notification.type) {
      case 'price_drop':
        return <Badge className="bg-green-500 text-white">Price Drop</Badge>
      case 'price_increase':
        return <Badge className="bg-red-500 text-white">Price Increase</Badge>
      case 'new_match':
        return <Badge className="bg-blue-500 text-white">New Match</Badge>
      case 'vehicle_sold':
        return <Badge className="bg-gray-500 text-white">Sold</Badge>
      default:
        return <Badge>Update</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPriceChange = () => {
    if (notification.type === 'price_drop' && notification.vehicleInfo.previousPrice) {
      const change = notification.vehicleInfo.previousPrice - notification.vehicleInfo.price
      const percentChange = (change / notification.vehicleInfo.previousPrice) * 100
      return {
        amount: change,
        percent: percentChange,
        isPositive: true
      }
    }
    if (notification.type === 'price_increase' && notification.vehicleInfo.previousPrice) {
      const change = notification.vehicleInfo.price - notification.vehicleInfo.previousPrice
      const percentChange = (change / notification.vehicleInfo.previousPrice) * 100
      return {
        amount: change,
        percent: percentChange,
        isPositive: false
      }
    }
    return null
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    setIsOpen(true)
  }

  const handleStar = () => {
    onUpdateNotification(notification.id, { isStarred: !notification.isStarred })
    toast({
      title: notification.isStarred ? "Unstarred" : "Starred",
      description: `Notification ${notification.isStarred ? 'removed from' : 'added to'} favorites.`,
    })
  }

  const handleArchive = () => {
    onUpdateNotification(notification.id, { isArchived: !notification.isArchived })
    toast({
      title: notification.isArchived ? "Unarchived" : "Archived",
      description: `Notification ${notification.isArchived ? 'restored from' : 'moved to'} archive.`,
    })
  }

  const handleShare = () => {
    // In a real app, this would share the notification
    toast({
      title: "Share Notification",
      description: "Sharing functionality coming soon.",
    })
  }

  const handleEdit = () => {
    // In a real app, this would open an edit modal
    toast({
      title: "Edit Notification",
      description: "Edit functionality coming soon.",
    })
  }

  const priceChange = getPriceChange()

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${getNotificationColor()} ${
          !notification.isRead ? 'ring-2 ring-primary/20' : ''
        } ${notification.isArchived ? 'opacity-60' : ''}`}
        onClick={handleClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background/50">
                {getNotificationIcon()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  {getNotificationBadge()}
                  {notification.isStarred && (
                    <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                      ⭐ Starred
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {notification.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-background/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStar(); }}>
                    {notification.isStarred ? '⭐ Unstar' : '⭐ Star'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(); }}>
                    {notification.isArchived ? '📁 Unarchive' : '📁 Archive'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {notification.vehicleInfo.year} {notification.vehicleInfo.make} {notification.vehicleInfo.model}
              </div>
              {notification.vehicleInfo.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {notification.vehicleInfo.location}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-lg">
                {formatPrice(notification.vehicleInfo.price)}
              </div>
              {priceChange && (
                <div className={`text-sm ${priceChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange.isPositive ? '-' : '+'}{formatPrice(priceChange.amount)} ({priceChange.percent.toFixed(1)}%)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getNotificationIcon()}
              {notification.title}
            </DialogTitle>
            <DialogDescription>
              Alert: {notification.alertTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {notification.vehicleInfo.imageUrl ? (
                    <img 
                      src={notification.vehicleInfo.imageUrl} 
                      alt={`${notification.vehicleInfo.make} ${notification.vehicleInfo.model}`}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">
                      {notification.vehicleInfo.year} {notification.vehicleInfo.make} {notification.vehicleInfo.model}
                    </div>
                    {notification.vehicleInfo.location && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {notification.vehicleInfo.location}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="font-semibold text-lg">
                      {formatPrice(notification.vehicleInfo.price)}
                    </span>
                  </div>
                  
                  {priceChange && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price Change</span>
                      <span className={`font-semibold ${priceChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChange.isPositive ? '-' : '+'}{formatPrice(priceChange.amount)} ({priceChange.percent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  
                  {notification.vehicleInfo.mileage && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Mileage</span>
                      <span className="text-sm">
                        {notification.vehicleInfo.mileage.toLocaleString()} miles
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              {notification.description}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onDismiss(notification.id)}
              className="flex-1 bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-12 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              Dismiss
            </Button>
            <Button 
              onClick={() => {
                // In a real app, this would open the vehicle listing
                toast({
                  title: "View Vehicle",
                  description: "Opening vehicle listing...",
                })
                setIsOpen(false)
              }}
              className="flex-1 bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              View Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
