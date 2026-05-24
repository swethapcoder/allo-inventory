import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { productId, warehouseId, units } = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      })
      if (!inventory) throw new Error('Inventory not found')

      const available = inventory.totalUnits - inventory.reservedUnits
      if (available < units) throw new Error('Not enough stock')

      // ✅ ONLY increment reservedUnits – totalUnits stays the same
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedUnits: { increment: units } },
      })

      return await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity: units,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      })
    })

    return NextResponse.json({ reservation: result }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Not enough stock')
      return NextResponse.json({ error: 'Not enough stock' }, { status: 409 })
    if (error.message === 'Inventory not found')
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}