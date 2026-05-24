'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Reservation = {
  id: string
  product: { name: string }
  warehouse: { name: string; location?: string }
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

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/reservations/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found')
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

  useEffect(() => {
    if (!res || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, res])

  async function confirm() {
  const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
  if (res.status === 410) alert('Expired')
  else if (res.ok) { alert('Confirmed!'); router.push('/') }
  else alert('Error confirming')
}

  async function cancel() {
    if (!id) return
    await fetch(`/api/reservations/${id}/release`, { method: 'POST' })
    alert('Cancelled'); router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-teal-400 font-mono animate-pulse">Loading reservation...</div>
      </div>
    )
  }

  if (!res) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 font-mono">Reservation not found</div>
      </div>
    )
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isPending = res.status === 'PENDING' && timeLeft > 0
  const percentage = (timeLeft / (15 * 60)) * 100 // 15 min expiry

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm shadow-2xl shadow-teal-900/20">
        {/* Header gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-blue-500 rounded-t-2xl" />

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              Reservation
            </h1>
            <span className="px-3 py-1 text-xs font-mono bg-teal-950/60 border border-teal-800 rounded-full text-teal-300">
              {res.status}
            </span>
          </div>

          {/* Product & warehouse details */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono text-sm">Product</span>
              <span className="text-slate-200 font-medium">{res.product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono text-sm">Warehouse</span>
              <span className="text-slate-200">{res.warehouse?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono text-sm">Quantity</span>
              <span className="text-slate-200">{res.quantity}</span>
            </div>
          </div>

          {/* Timer card */}
          {isPending && (
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-teal-400 tracking-wider uppercase">Time remaining</span>
                <span className="font-mono text-3xl font-bold text-white">
                  {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">Expires at {new Date(res.expiresAt).toLocaleTimeString()}</p>
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirm}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-900 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-teal-900/30"
              >
                Confirm Purchase
              </button>
              <button
                onClick={cancel}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {!isPending && (
            <div className="rounded-xl bg-red-950/40 border border-red-800/50 p-4 text-center">
              <p className="text-red-300 font-mono text-sm">
                Reservation {res.status.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}