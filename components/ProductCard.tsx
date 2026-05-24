'use client'

import { Product } from '@/lib/types'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  product: Product
  refreshProducts: () => Promise<void>
}

export default function ProductCard({
  product,
  refreshProducts,
}: Props) {
  const router = useRouter()

  async function reserve(
    warehouseId: string,
    quantity: number = 1,
  ) {
    try {
      const res = await api.post('/reservations', {
        productId: product.id,
        warehouseId,
        quantity,
      })

      toast.success('Reservation created successfully')

      await refreshProducts()

      router.push(`/reservation/${res.data.id}`)
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Not enough stock available')
      } else {
        toast.error('Failed to create reservation')
      }
    }
  }

  return (
    <div className="border rounded-2xl p-5 shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4">
        {product.name}
      </h2>
        <div className="space-y-4">
        {product.stocks.map((stock) => (
          <div
            key={stock.warehouseId}
            className="border rounded-xl p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">
                {stock.warehouseName}
              </span>

              <span>
                Available: {stock.availableUnits}
              </span>
            </div>

            <button
              onClick={() => reserve(stock.warehouseId)}
              disabled={stock.availableUnits <= 0}
              className="w-full bg-black text-white py-2 rounded-lg disabled:opacity-50"
            >
              Reserve
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}