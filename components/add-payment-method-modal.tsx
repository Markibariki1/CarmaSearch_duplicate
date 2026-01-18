"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Calendar, User, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentMethod {
  id: string
  type: 'visa' | 'mastercard' | 'amex' | 'discover'
  last4: string
  expiryMonth: string
  expiryYear: string
  cardholderName: string
  isDefault: boolean
}

interface AddPaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id'>) => void
}

export function AddPaymentMethodModal({ isOpen, onClose, onAddPaymentMethod }: AddPaymentMethodModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    type: '' as 'visa' | 'mastercard' | 'amex' | 'discover' | ''
  })

  const getCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | '' => {
    const cleaned = cardNumber.replace(/\s/g, '')
    if (/^4/.test(cleaned)) return 'visa'
    if (/^5[1-5]/.test(cleaned)) return 'mastercard'
    if (/^3[47]/.test(cleaned)) return 'amex'
    if (/^6(?:011|5)/.test(cleaned)) return 'discover'
    return ''
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const groups = cleaned.match(/.{1,4}/g) || []
    return groups.join(' ')
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      const formatted = formatCardNumber(value)
      const cardType = getCardType(value)
      setFormData(prev => ({
        ...prev,
        cardNumber: formatted,
        type: cardType
      }))
    } else if (field === 'expiryDate') {
      const formatted = formatExpiryDate(value)
      const [month, year] = formatted.split('/')
      setFormData(prev => ({
        ...prev,
        expiryMonth: month || '',
        expiryYear: year || ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleChromeAutofill = () => {
    // Simulate Chrome autofill
    setFormData({
      cardNumber: '4532 1234 5678 9012',
      expiryMonth: '12',
      expiryYear: '25',
      cvv: '123',
      cardholderName: 'John Doe',
      type: 'visa'
    })
    
    toast({
      title: "Chrome Autofill",
      description: "Payment details filled from Chrome's saved information.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    const last4 = formData.cardNumber.slice(-4)
    const newPaymentMethod = {
      type: formData.type,
      last4,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      cardholderName: formData.cardholderName,
      isDefault: false
    }

    onAddPaymentMethod(newPaymentMethod)
    
    toast({
      title: "Payment Method Added",
      description: "Your payment method has been successfully added.",
    })

    // Reset form
    setFormData({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
      type: ''
    })

    setIsLoading(false)
    onClose()
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Method
          </DialogTitle>
          <DialogDescription>
            Add a new credit or debit card to your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chrome Autofill Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChromeAutofill}
              className="text-xs bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-10 px-4 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <Lock className="h-3 w-3 mr-1" />
              Use Chrome Autofill
            </Button>
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                maxLength={19}
                required
                className="pr-10"
              />
              {formData.type && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                  {getCardIcon(formData.type)}
                </div>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              type="text"
              placeholder="John Doe"
              value={formData.cardholderName}
              onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              required
            />
          </div>

          {/* Expiry Date and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="text"
                placeholder="MM/YY"
                value={`${formData.expiryMonth}${formData.expiryYear ? '/' + formData.expiryYear : ''}`}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="text"
                placeholder="123"
                value={formData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={4}
                required
              />
            </div>
          </div>

          {/* Card Preview */}
          {formData.cardNumber && (
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-lg font-bold">
                    {formData.type.toUpperCase()}
                  </div>
                  <div className="text-2xl">💳</div>
                </div>
                <div className="text-xl font-mono mb-2">
                  •••• •••• •••• {formData.cardNumber.slice(-4)}
                </div>
                <div className="flex justify-between text-sm">
                  <span>{formData.cardholderName || 'CARDHOLDER NAME'}</span>
                  <span>
                    {formData.expiryMonth || 'MM'}/{formData.expiryYear || 'YY'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-12 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]">
              {isLoading ? "Adding..." : "Add Payment Method"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
