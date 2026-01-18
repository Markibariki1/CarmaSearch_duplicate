"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddAlertModal } from "@/components/add-alert-modal"
import { AlertList } from "@/components/alert-list"
import { PriceNotification } from "@/components/price-notification"
import { ArrowLeft, Bell, Plus, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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

export default function AlertsPage() {
  const { toast } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    {
      id: '1',
      type: 'vehicle',
      title: 'Tesla Model 3 Performance',
      vehicleUrl: 'https://example.com/tesla-model-3',
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastNotification: new Date('2024-01-20'),
      notificationCount: 2
    },
    {
      id: '2',
      type: 'custom',
      title: 'BMW 3 Series Under $35k',
      make: 'BMW',
      model: '3 Series',
      maxPrice: 35000,
      location: 'San Francisco, CA',
      isActive: true,
      createdAt: new Date('2024-01-10'),
      notificationCount: 1
    }
  ])
  
  const [notifications, setNotifications] = useState<PriceNotification[]>([
    {
      id: '1',
      alertId: '1',
      type: 'price_drop',
      title: 'Price Drop Alert',
      description: 'The Tesla Model 3 Performance you\'re watching has dropped in price!',
      vehicleInfo: {
        make: 'Tesla',
        model: 'Model 3',
        year: '2023',
        price: 45000,
        previousPrice: 48000,
        location: 'San Francisco, CA',
        mileage: 15000,
        imageUrl: '/tesla-model-3-2022.jpg'
      },
      alertTitle: 'Tesla Model 3 Performance',
      createdAt: new Date('2024-01-20'),
      isArchived: false,
      isStarred: false,
      isRead: false
    },
    {
      id: '2',
      alertId: '2',
      type: 'new_match',
      title: 'New Match Found',
      description: 'A new BMW 3 Series matching your criteria has been found!',
      vehicleInfo: {
        make: 'BMW',
        model: '3 Series',
        year: '2022',
        price: 32000,
        location: 'San Francisco, CA',
        mileage: 25000,
        imageUrl: '/placeholder.jpg'
      },
      alertTitle: 'BMW 3 Series Under $35k',
      createdAt: new Date('2024-01-19'),
      isArchived: false,
      isStarred: true,
      isRead: false
    }
  ])

  const handleAddAlert = (newAlert: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const alert: PriceAlert = {
      ...newAlert,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    setAlerts(prev => [...prev, alert])
  }

  const handleUpdateAlert = (id: string, updates: Partial<PriceAlert>) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, ...updates } : alert
      )
    )
  }

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
    // Also remove related notifications
    setNotifications(prev => prev.filter(notification => notification.alertId !== id))
  }

  const handleEditAlert = (alert: PriceAlert) => {
    // In a real app, this would open an edit modal
    toast({
      title: "Edit Alert",
      description: "Edit functionality coming soon.",
    })
  }

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    )
    // Update alert notification count
    const notification = notifications.find(n => n.id === id)
    if (notification) {
      const alert = alerts.find(a => a.id === notification.alertId)
      if (alert && alert.notificationCount && alert.notificationCount > 0) {
        handleUpdateAlert(notification.alertId, { 
          notificationCount: alert.notificationCount - 1 
        })
      }
    }
  }

  const handleUpdateNotification = (id: string, updates: Partial<PriceNotification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, ...updates } : notification
      )
    )
  }

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const totalNotifications = notifications.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 w-12 flex items-center justify-center hover:bg-black/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95">
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Price Alerts</h1>
                <p className="text-sm text-muted-foreground">
                  {alerts.length} active alerts • {unreadNotifications.length} unread notifications
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-12 px-4 hover:bg-black/30 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Alert
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-1">
            <TabsTrigger 
              value="alerts" 
              className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/60 transition-all duration-200"
            >
              My Alerts ({alerts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=inactive]:text-white/60 transition-all duration-200"
            >
              Notifications ({unreadNotifications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Price Alerts</h2>
                <p className="text-muted-foreground">
                  Manage your vehicle price alerts and search criteria.
                </p>
              </div>
            </div>
            <AlertList
              alerts={alerts}
              onUpdateAlert={handleUpdateAlert}
              onDeleteAlert={handleDeleteAlert}
              onEditAlert={handleEditAlert}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Price Notifications</h2>
                <p className="text-muted-foreground">
                  Latest updates on your price alerts and new matches.
                </p>
              </div>
              {unreadNotifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    notifications.forEach(notification => {
                      if (!notification.isRead) {
                        handleMarkNotificationAsRead(notification.id)
                      }
                    })
                    toast({
                      title: "All Notifications Read",
                      description: "All notifications have been marked as read.",
                    })
                  }}
                  className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl h-10 px-4 hover:bg-black/30 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  Mark All Read
                </Button>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <Card className="text-center p-12">
                <CardContent>
                  <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle className="mb-2">No Notifications</CardTitle>
                  <CardDescription>
                    You&apos;ll receive notifications here when your price alerts are triggered.
                  </CardDescription>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <PriceNotification
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onUpdateNotification={handleUpdateNotification}
                    onDismiss={handleDismissNotification}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Alert Modal */}
      <AddAlertModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddAlert={handleAddAlert}
      />
    </div>
  )
}
