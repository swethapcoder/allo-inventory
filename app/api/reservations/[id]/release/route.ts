import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Already ${reservation.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: 'RELEASED' },
      })
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedUnits: { decrement: reservation.quantity },
        },
      })
    })

    return NextResponse.json({ success: true, message: 'Released' })
  } catch (error) {
    console.error('Release error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}