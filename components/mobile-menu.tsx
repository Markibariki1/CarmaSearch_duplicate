"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Home, Search, TrendingUp, Bell, Settings, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const router = useRouter()

  const menuItems = [
    { icon: Home, label: "Home", action: () => router.push("/") },
    { icon: Search, label: "Compare Vehicles", action: () => router.push("/#compare-section") },
    { icon: TrendingUp, label: "Portfolio", action: () => router.push("/portfolio") },
    { icon: Bell, label: "Price Alerts", action: () => router.push("/#price-alerts") },
    { icon: Settings, label: "Account Settings", action: () => router.push("/account") },
    { icon: HelpCircle, label: "Help & Support", action: () => router.push("/help") },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl">
        <div className="flex items-center justify-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <div className="w-5 h-5 rounded-full border border-primary" />
            </div>
            <span className="font-bold text-xl text-white">CARMA</span>
          </div>
        </div>

        <div className="p-6 space-y-2">
          {menuItems.map((item) => (
            <Button 
              key={item.label} 
              variant="ghost" 
              className="w-full justify-start gap-4 h-14 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]" 
              onClick={() => {
                item.action()
                onClose()
              }}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          ))}
        </div>

        <Separator className="bg-white/10" />

        <div className="p-6">
          <div className="text-xs text-white/40 text-center font-medium">CARMA v1.0.0</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
