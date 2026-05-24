'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Stock = {
  warehouseId: string
  warehouseName: string
  totalUnits: number
  reservedUnits: number
  availableUnits: number
}

type Product = {
  id: string
  name: string
  stocks: Stock[]
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function reserveProduct(productId: string, warehouseId: string) {
    const key = `${productId}-${warehouseId}`
    setReserving(key)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, units: 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Reservation failed')
        return
      }
      router.push(`/reservation/${data.reservation.id}`)
    } catch (err) {
      console.error(err)
      alert('Network error – check if server is running')
    } finally {
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-teal-400 font-mono">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-mono text-xs text-teal-400 tracking-wider uppercase">Live inventory</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            Warehouse Stock
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg">
            Reserve items across fulfilment centres. Holds valid for 15 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden hover:border-slate-700 transition-all hover:-translate-y-1">
              <div className="h-1 w-full bg-gradient-to-r from-teal-400 to-blue-500" />
              <div className="p-5">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">{product.name}</h2>
                <div className="space-y-3">
                  {product.stocks.map((stock) => (
                    <div key={stock.warehouseId} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div>
                        <p className="font-medium text-slate-200">{stock.warehouseName}</p>
                        <p className="text-sm text-teal-400 font-mono">{stock.availableUnits} available</p>
                        <p className="text-xs text-slate-500">Total: {stock.totalUnits} | Reserved: {stock.reservedUnits}</p>
                      </div>
                      <button
                        onClick={() => reserveProduct(product.id, stock.warehouseId)}
                        disabled={reserving === `${product.id}-${stock.warehouseId}` || stock.availableUnits === 0}
                        className="px-4 py-2 rounded-lg font-medium transition-all bg-teal-500 hover:bg-teal-400 text-slate-900 disabled:bg-slate-700 disabled:text-slate-500"
                      >
                        {reserving === `${product.id}-${stock.warehouseId}` ? '...' : 'Reserve'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}