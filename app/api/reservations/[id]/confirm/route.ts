// app/api/reservations/[id]/confirm/route.ts
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
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }
    if (reservation.status !== 'PENDING') {
      return NextResponse.json({ error: `Already ${reservation.status}` }, { status: 400 })
    }
    if (reservation.expiresAt < new Date()) {
      // release expired stock first
      await prisma.$transaction(async (tx) => {
        await tx.reservation.update({ where: { id }, data: { status: 'EXPIRED' } })
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: { reservedUnits: { decrement: reservation.quantity } },
        })
      })
      return NextResponse.json({ error: 'Reservation expired' }, { status: 410 })
    }

    // ✅ Stable confirm – all updates inside transaction
    await prisma.$transaction(async (tx) => {
      // 1. Refresh inventory with a pessimistic read (row lock)
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
      })
      if (!inventory) throw new Error('Inventory not found')

      // 2. Validate enough totalUnits and reservedUnits
      if (inventory.totalUnits < reservation.quantity) {
        throw new Error('Insufficient total stock')
      }
      if (inventory.reservedUnits < reservation.quantity) {
        throw new Error('Inconsistent reserved units')
      }

      // 3. Perform decrements
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      })

      // 4. Mark reservation as confirmed
      await tx.reservation.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      })
    })

    return NextResponse.json({ success: true, message: 'Confirmed' })
  } catch (error: any) {
    console.error(error)
    const message = error.message === 'Insufficient total stock' || error.message === 'Inconsistent reserved units'
      ? error.message
      : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}