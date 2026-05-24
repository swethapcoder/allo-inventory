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

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
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
      if (res.status === 409) {
        alert('❌ Not enough stock available')
        await fetchProducts()
        return
      }
      if (!res.ok) throw new Error(data.error || 'Reservation failed')
      alert(`✅ Reserved! ID: ${data.reservation.id}\nGo to /reservation/${data.reservation.id} to confirm`)
      await fetchProducts()
      router.push(`/reservation/${data.reservation.id}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setReserving(null)
    }
  }

  if (loading) {
    return <div className="p-10 text-center">Loading products...</div>
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Product Catalog</h1>
      <div className="grid gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold mb-3">{product.name}</h2>
            <div className="space-y-3">
              {product.stocks.map((stock) => (
                <div key={stock.warehouseId} className="flex justify-between items-center border-t pt-2">
                  <div>
                    <p className="font-medium">{stock.warehouseName}</p>
                    <p className="text-green-600 font-bold text-lg">{stock.availableUnits} available</p>
                    <p className="text-xs text-gray-500">Total: {stock.totalUnits} | Reserved: {stock.reservedUnits}</p>
                  </div>
                  <button
                    onClick={() => reserveProduct(product.id, stock.warehouseId)}
                    disabled={reserving === `${product.id}-${stock.warehouseId}` || stock.availableUnits === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
                  >
                    {reserving === `${product.id}-${stock.warehouseId}` ? '...' : 'Reserve'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}