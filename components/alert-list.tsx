"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bell, MoreVertical, Trash2, Edit, ExternalLink, Car, DollarSign, MapPin, Calendar, TrendingDown, TrendingUp } from "lucide-react"
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
  isActive: boolean
  createdAt: Date
  lastNotification?: Date
  notificationCount?: number
}

interface AlertListProps {
  alerts: PriceAlert[]
  onUpdateAlert: (id: string, updates: Partial<PriceAlert>) => void
  onDeleteAlert: (id: string) => void
  onEditAlert: (alert: PriceAlert) => void
}

export function AlertList({ alerts, onUpdateAlert, onDeleteAlert, onEditAlert }: AlertListProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)

  const handleToggleActive = (id: string, isActive: boolean) => {
    onUpdateAlert(id, { isActive })
    toast({
      title: isActive ? "Alert Enabled" : "Alert Disabled",
      description: `Your price alert has been ${isActive ? 'enabled' : 'disabled'}.`,
    })
  }

  const handleDeleteAlert = (id: string) => {
    onDeleteAlert(id)
    setDeleteDialogOpen(null)
    toast({
      title: "Alert Deleted",
      description: "Your price alert has been removed.",
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getAlertIcon = (type: 'vehicle' | 'custom') => {
    return type === 'vehicle' ? <ExternalLink className="h-4 w-4" /> : <Car className="h-4 w-4" />
  }

  const getAlertDescription = (alert: PriceAlert) => {
    if (alert.type === 'vehicle') {
      return `Monitoring specific vehicle listing`
    }
    
    const parts = []
    if (alert.make && alert.model) parts.push(`${alert.year || ''} ${alert.make} ${alert.model}`.trim())
    if (alert.maxPrice) parts.push(`Under $${alert.maxPrice.toLocaleString()}`)
    if (alert.location) parts.push(`in ${alert.location}`)
    
    return parts.length > 0 ? parts.join(' • ') : 'Custom search criteria'
  }

  if (alerts.length === 0) {
    return (
      <Card className="text-center p-12">
        <CardContent>
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No Price Alerts</CardTitle>
          <CardDescription>
            Create your first price alert to get notified when vehicle prices change or new matches are found.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <CardTitle className="text-lg">{alert.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {getAlertDescription(alert)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.notificationCount && alert.notificationCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    {alert.notificationCount} new
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditAlert(alert)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {alert.vehicleUrl && (
                      <DropdownMenuItem onClick={() => window.open(alert.vehicleUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Vehicle
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(alert.id)}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDate(alert.createdAt)}
                </div>
                {alert.lastNotification && (
                  <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Last alert {formatDate(alert.lastNotification)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {alert.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  checked={alert.isActive}
                  onCheckedChange={(checked) => handleToggleActive(alert.id, checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen !== null} onOpenChange={() => setDeleteDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Price Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this price alert? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialogOpen && handleDeleteAlert(deleteDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
