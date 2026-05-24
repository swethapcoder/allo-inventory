// app/api/reservations/[id]/confirm/route.ts (Complete version)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DistributedLock } from '@/lib/lock'
import { IdempotencyService } from '@/lib/idempotency'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idempotencyKey = request.headers.get('Idempotency-Key')
    
    // Idempotency check
    if (idempotencyKey) {
      const existing = await IdempotencyService.get(idempotencyKey)
      if (existing) {
        return NextResponse.json(existing.response, { status: existing.statusCode })
      }
    }

    const result = await DistributedLock.withLock(
      `confirm:${params.id}`,
      async () => {
        // Get reservation with fresh data
        const reservation = await prisma.reservation.findUnique({
          where: { id: params.id },
        })

        if (!reservation) {
          throw new Error('Reservation not found')
        }

        // Check if already processed
        if (reservation.status !== 'PENDING') {
          throw new Error(`Reservation already ${reservation.status.toLowerCase()}`)
        }

        // Check if expired
        if (reservation.expiresAt < new Date()) {
          // Release the reserved stock first
          await prisma.$transaction(async (tx) => {
            await tx.reservation.update({
              where: { id: params.id },
              data: { status: 'EXPIRED' },
            })
            
            await tx.stockLevel.update({
              where: {
                productId_warehouseId: {
                  productId: reservation.productId,
                  warehouseId: reservation.warehouseId,
                },
              },
              data: {
                reservedUnits: {
                  decrement: reservation.units,
                },
              },
            })
          })
          throw new Error('Reservation has expired')
        }

        // Confirm and permanently deduct stock
        await prisma.$transaction(async (tx) => {
          await tx.reservation.update({
            where: { id: params.id },
            data: { status: 'CONFIRMED' },
          })

          // Deduct from total units and remove from reserved
          await tx.stockLevel.update({
            where: {
              productId_warehouseId: {
                productId: reservation.productId,
                warehouseId: reservation.warehouseId,
              },
            },
            data: {
              totalUnits: {
                decrement: reservation.units,
              },
              reservedUnits: {
                decrement: reservation.units,
              },
            },
          })
        })

        return { 
          success: true, 
          message: 'Reservation confirmed successfully',
          reservationId: params.id
        }
      }
    )

    // Store idempotency response
    if (idempotencyKey) {
      await IdempotencyService.set(idempotencyKey, result, 200)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message === 'Reservation not found') {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }
    
    if (error.message?.includes('already')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    if (error.message === 'Reservation has expired') {
      return NextResponse.json(
        { error: 'Reservation has expired' },
        { status: 410 }
      )
    }
    
    console.error('Error confirming reservation:', error)
    return NextResponse.json(
      { error: 'Failed to confirm reservation' },
      { status: 500 }
    )
  }
}