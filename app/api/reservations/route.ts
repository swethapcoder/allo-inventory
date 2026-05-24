import { NextResponse } from 'next/server'
import { createReservation } from '@/lib/reservation'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { productId, warehouseId, quantity } = body

    const reservation = await createReservation(
      productId,
      warehouseId,
      quantity,
    )

    return NextResponse.json(reservation)
  } catch (error: any) {
    console.error(error)

    if (error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        {
          error: 'Not enough stock available',
        },
        {
          status: 409,
        },
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create reservation',
      },
      {
        status: 500,
      },
    )
  }
}