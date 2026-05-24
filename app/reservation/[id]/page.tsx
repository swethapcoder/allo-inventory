// app/reservation/[id]/page.tsx (Complete with timer)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Clock, CheckCircle, XCircle, Package, Warehouse, MapPin, AlertCircle } from 'lucide-react'

interface Reservation {
  id: string
  productId: string
  warehouseId: string
  units: number
  status: string
  expiresAt: string
  createdAt: string
  product: {
    id: string
    name: string
    sku: string
    description: string
  }
  warehouse: {
    id: string
    name: string
    location: string
  }
}

export default function ReservationPage({ params }: { params: { id: string } }) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [confirming, setConfirming] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchReservation()
    
    // Refresh every 30 seconds to check status
    const interval = setInterval(fetchReservation, 30000)
    return () => clearInterval(interval)
  }, [params.id])

  useEffect(() => {
    if (reservation && reservation.status === 'PENDING') {
      const timer = setInterval(() => {
        const expiry = new Date(reservation.expiresAt).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
        setTimeLeft(remaining)
        
        if (remaining <= 0 && reservation.status === 'PENDING') {
          clearInterval(timer)
          toast({
            title: 'Reservation Expired',
            description: 'Your reservation has expired. The inventory has been released.',
            variant: 'destructive',
          })
          fetchReservation() // Refresh to show expired status
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [reservation])

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${params.id}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch reservation')
      }
      const data = await response.json()
      setReservation(data.reservation)
      
      if (data.reservation.status === 'PENDING') {
        const expiry = new Date(data.reservation.expiresAt).getTime()
        const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
        setTimeLeft(remaining)
      }
    } catch (error) {
      console.error('Error fetching reservation:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reservation details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const response = await fetch(`/api/reservations/${params.id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.status === 410) {
        toast({
          title: 'Reservation Expired',
          description: 'Your reservation has expired. Please create a new one.',
          variant: 'destructive',
        })
        await fetchReservation()
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm reservation')
      }

      toast({
        title: 'Purchase Confirmed! 🎉',
        description: `Your reservation for ${reservation?.units} unit(s) has been confirmed.`,
      })
      
      // Refresh to show confirmed status
      await fetchReservation()
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm reservation',
        variant: 'destructive',
      })
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = async () => {
    setReleasing(true)
    try {
      const response = await fetch(`/api/reservations/${params.id}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release reservation')
      }

      toast({
        title: 'Reservation Cancelled',
        description: 'Your reservation has been cancelled. Inventory has been released.',
      })
      
      await fetchReservation()
      
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel reservation',
        variant: 'destructive',
      })
    } finally {
      setReleasing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-600'
    if (timeLeft <= 180) return 'text-orange-600'
    return 'text-blue-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!reservation) {
    return null
  }

  const isExpired = reservation.status === 'EXPIRED' || (reservation.status === 'PENDING' && timeLeft <= 0)
  const isConfirmed = reservation.status === 'CONFIRMED'
  const isReleased = reservation.status === 'RELEASED'
  const isPending = reservation.status === 'PENDING' && !isExpired

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className={`
          ${isConfirmed ? 'bg-green-50 border-b border-green-200' : ''}
          ${isReleased ? 'bg-red-50 border-b border-red-200' : ''}
          ${isExpired ? 'bg-gray-50 border-b border-gray-200' : ''}
          ${isPending ? 'bg-blue-50 border-b border-blue-200' : ''}
        `}>
          <div className="flex items-center gap-3">
            {isConfirmed && <CheckCircle className="h-8 w-8 text-green-600" />}
            {isReleased && <XCircle className="h-8 w-8 text-red-600" />}
            {isExpired && <AlertCircle className="h-8 w-8 text-gray-600" />}
            {isPending && <Clock className="h-8 w-8 text-blue-600 animate-pulse" />}
            <div>
              <CardTitle className="text-2xl">
                {isConfirmed && 'Purchase Confirmed! ✅'}
                {isReleased && 'Reservation Cancelled'}
                {isExpired && 'Reservation Expired'}
                {isPending && 'Complete Your Purchase'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isConfirmed && 'Thank you for your purchase. Your items have been secured.'}
                {isReleased && 'The inventory has been released back to stock.'}
                {isExpired && 'The time window has passed. Please create a new reservation.'}
                {isPending && `You have ${formatTime(timeLeft)} to complete your purchase`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Order Summary */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
            
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="font-medium">{reservation.product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {reservation.product.sku}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">Quantity: {reservation.units}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Warehouse className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <div className="font-medium">{reservation.warehouse.name}</div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {reservation.warehouse.location}
                </div>
              </div>
            </div>
          </div>

          {/* Timer Display for Pending */}
          {isPending && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 text-center">
              <div className="text-sm text-blue-700 mb-2">Time remaining to confirm</div>
              <div className={`text-5xl font-mono font-bold ${getTimeColor()}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Reservation expires at {new Date(reservation.expiresAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Warning for expiring soon */}
          {isPending && timeLeft <= 60 && timeLeft > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Hurry up! Your reservation is expiring soon.</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-4 pt-4">
          {isPending && (
            <>
              <Button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base"
              >
                {confirming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase ✅'
                )}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={releasing}
                variant="outline"
                className="flex-1 h-12 text-base"
              >
                {releasing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel ✕'
                )}
              </Button>
            </>
          )}
          
          {(isConfirmed || isReleased || isExpired) && (
            <Button 
              onClick={() => router.push('/')} 
              className="w-full h-12 text-base"
            >
              Browse More Products →
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}