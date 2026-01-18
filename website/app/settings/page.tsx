"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
import { AddPaymentMethodModal } from "@/components/add-payment-method-modal"
import { useTheme } from "next-themes"
import { 
  ArrowLeft, 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Palette,
  Settings as SettingsIcon,
  Trash2,
  MoreVertical,
  Star
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { createBrowserSupabase } from "@/utils/supabase/client"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SettingsSection = 'general' | 'appearance' | 'notifications' | 'security' | 'billing' | 'account'

interface PaymentMethod {
  id: string
  type: 'visa' | 'mastercard' | 'amex' | 'discover'
  last4: string
  expiryMonth: string
  expiryYear: string
  cardholderName: string
  isDefault: boolean
}

const settingsSections = [
  { id: 'general' as SettingsSection, label: 'General', icon: SettingsIcon },
  { id: 'appearance' as SettingsSection, label: 'Appearance', icon: Palette },
  { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
  { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
  { id: 'billing' as SettingsSection, label: 'Billing', icon: CreditCard },
  { id: 'account' as SettingsSection, label: 'Account', icon: User },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { user, isAuthenticated, signOut } = useAuth()
  const supabase = createBrowserSupabase()
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiryMonth: '12',
      expiryYear: '25',
      cardholderName: 'John Doe',
      isDefault: true
    }
  ])

  // Account profile state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Load user profile on component mount
  const loadProfile = useCallback(async () => {
    if (!user) return
    
    setIsLoadingProfile(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, website')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setWebsite(data.website || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
    setIsLoadingProfile(false)
  }, [supabase, user])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile()
    }
  }, [isAuthenticated, user, loadProfile])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsLoadingProfile(true)
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        username,
        website,
        updated_at: new Date().toISOString(),
      })
      
      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
    setIsLoadingProfile(false)
  }

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    })
  }

  const handleChangePassword = () => {
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    })
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    try {
      // Delete user profile from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        window.location.href = '/'
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed Out",
        description: "You've been successfully signed out.",
      })
      window.location.href = '/'
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleAddPaymentMethod = (newPaymentMethod: Omit<PaymentMethod, 'id'>) => {
    const paymentMethod: PaymentMethod = {
      ...newPaymentMethod,
      id: Date.now().toString()
    }
    setPaymentMethods(prev => [...prev, paymentMethod])
  }

  const handleSetDefaultPayment = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(pm => ({
        ...pm,
        isDefault: pm.id === id
      }))
    )
    toast({
      title: "Default Payment Method",
      description: "Your default payment method has been updated.",
    })
  }

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.filter(pm => pm.id !== id))
    toast({
      title: "Payment Method Removed",
      description: "The payment method has been removed from your account.",
    })
  }

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa':
        return '💳'
      case 'mastercard':
        return '💳'
      case 'amex':
        return '💳'
      case 'discover':
        return '💳'
      default:
        return '💳'
    }
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">General</h2>
              <p className="text-muted-foreground">Manage your general account settings and preferences.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                </div>
                <Button onClick={handleSaveProfile} className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Appearance</h2>
              <p className="text-muted-foreground">Customize how CARMA looks on your device.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Choose your preferred color scheme and display options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme-toggle">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark themes
                    </p>
                  </div>
                  <Switch
                    id="theme-toggle"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">Configure how you receive notifications and updates.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notices</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your account
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="price-alerts">Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when vehicle prices change
                    </p>
                  </div>
                  <Switch
                    id="price-alerts"
                    checked={priceAlerts}
                    onCheckedChange={setPriceAlerts}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive newsletters and promotional content
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={marketingEmails}
                    onCheckedChange={setMarketingEmails}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Security</h2>
              <p className="text-muted-foreground">Manage your password and security preferences.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Update your password and manage security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button onClick={handleChangePassword} className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">Change Password</Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Billing</h2>
              <p className="text-muted-foreground">Manage your payment methods and billing information.</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Add and manage your payment methods for subscriptions and purchases.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {paymentMethods.map((paymentMethod) => (
                    <div
                      key={paymentMethod.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getCardIcon(paymentMethod.type)}</div>
                        <div>
                          <div className="font-medium">
                            {paymentMethod.type.toUpperCase()} •••• {paymentMethod.last4}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {paymentMethod.cardholderName} • Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                          </div>
                        </div>
                        {paymentMethod.isDefault && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!paymentMethod.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefaultPayment(paymentMethod.id)}
                            >
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                            className="text-destructive"
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddPaymentModalOpen(true)}
                  className="w-full bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-12 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past invoices and payment history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  No billing history available.
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Account</h2>
              <p className="text-muted-foreground">Manage your account settings and authentication.</p>
            </div>
            
            {/* Supabase User Profile */}
            {isAuthenticated && user && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-email">Email Address</Label>
                      <Input 
                        id="account-email" 
                        value={user.email || ''} 
                        disabled 
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-fullname">Full Name</Label>
                      <Input 
                        id="account-fullname" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-username">Username</Label>
                      <Input 
                        id="account-username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-website">Website</Label>
                      <Input 
                        id="account-website" 
                        value={website} 
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://your-website.com"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={isLoadingProfile}
                        className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                      >
                        {isLoadingProfile ? "Updating..." : "Update Profile"}
                      </Button>

                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleSignOut}
                        className="bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                      >
                        Sign Out
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="bg-red-500/20 backdrop-blur-sm border border-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to app
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-12",
                      activeSection === section.id && "bg-secondary"
                    )}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        onAddPaymentMethod={handleAddPaymentMethod}
      />

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
