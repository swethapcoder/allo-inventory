// app/page.tsx (Corrected for your actual API)
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

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
      const response = await axios.get('/api/products')
      // Your API returns the array directly, not wrapped in { products: ... }
      setProducts(response.data)
    } catch (error) {
      console.error(error)
      alert('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  async function reserveProduct(
    productId: string,
    warehouseId: string,
    productName: string
  ) {
    const reserveKey = `${productId}-${warehouseId}`
    setReserving(reserveKey)
    
    try {
      const response = await axios.post(
        '/api/reservations',
        {
          productId,
          warehouseId,
          units: 1,
        },
      )

      alert(`Reservation created! Redirecting to checkout...`)
      
      // Navigate to the reservation page
      router.push(`/reservation/${response.data.reservation.id}`)
      
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert('Not enough stock available')
        // Refresh to show updated stock
        fetchProducts()
      } else if (error.response?.status === 410) {
        alert('Reservation expired')
      } else {
        alert(error.response?.data?.error || 'Something went wrong')
      }
    } finally {
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Product Catalog</h1>
      <p className="text-gray-600 mb-8">Browse and reserve inventory across our warehouses</p>

      <div className="grid gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-4">{product.name}</h2>

            <div className="space-y-3">
              {product.stocks.map((stock) => (
                <div
                  key={stock.warehouseId}
                  className="flex items-center justify-between border p-4 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{stock.warehouseName}</p>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-green-600">
                        {stock.availableUnits}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">available</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Total: {stock.totalUnits} | Reserved: {stock.reservedUnits}
                    </div>
                  </div>

                  <button
                    onClick={() => reserveProduct(product.id, stock.warehouseId, product.name)}
                    disabled={reserving === `${product.id}-${stock.warehouseId}` || stock.availableUnits === 0}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-all
                      ${stock.availableUnits === 0 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }
                    `}
                  >
                    {reserving === `${product.id}-${stock.warehouseId}` ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Reserving...
                      </div>
                    ) : (
                      'Reserve'
                    )}
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