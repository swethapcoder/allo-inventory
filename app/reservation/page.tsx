// app/reservation/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Reservation = {
  id: string
  product: { name: string }
  warehouse: { name: string }
  quantity: number
  status: string
  expiresAt: string
}

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const [res, setRes] = useState<Reservation | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string | null>(null)
  const router = useRouter()

  // Unwrap params Promise (Next.js 15+)
  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  // Fetch reservation when id is available
  useEffect(() => {
    if (!id) return
    fetch(`/api/reservations/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Reservation not found')
        return res.json()
      })
      .then(data => {
        setRes(data.reservation)
        const expiry = new Date(data.reservation.expiresAt).getTime()
        setTimeLeft(Math.max(0, Math.floor((expiry - Date.now()) / 1000)))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  // Countdown timer
  useEffect(() => {
    if (!res || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, res])

  async function confirm() {
    if (!id) return
    const response = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
    if (response.status === 410) alert('Reservation expired')
    else if (response.ok) { alert('Confirmed!'); router.push('/') }
    else alert('Error confirming')
  }

  async function cancel() {
    if (!id) return
    await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    alert('Cancelled'); router.push('/')
  }

  if (loading) return <div className="p-10 text-center">Loading reservation...</div>
  if (!res) return <div className="p-10 text-center text-red-600">Reservation not found</div>

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isPending = res.status === 'PENDING' && timeLeft > 0

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reservation</h1>
      <p><strong>Product:</strong> {res.product?.name || 'Unknown'}</p>
      <p><strong>Warehouse:</strong> {res.warehouse?.name || 'Unknown'}</p>
      <p><strong>Quantity:</strong> {res.quantity}</p>
      <p><strong>Time left:</strong> {mins}:{secs.toString().padStart(2, '0')}</p>
      {isPending && (
        <div className="flex gap-4 mt-6">
          <button onClick={confirm} className="bg-green-600 text-white px-4 py-2 rounded">Confirm Purchase</button>
          <button onClick={cancel} className="bg-red-600 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      )}
      {!isPending && <p className="text-red-600 mt-4">Reservation {res.status.toLowerCase()}</p>}
    </div>
  )
}