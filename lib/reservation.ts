import { prisma } from './prisma'

const RESERVATION_DURATION_MINUTES = 10

export async function createReservation(
  productId: string,
  warehouseId: string,
  quantity: number,
) {
  return await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findFirst({
      where: {
        productId,
        warehouseId,
      },
    })

    if (!inventory) {
      throw new Error('Inventory not found')
    }

    const available =
      inventory.totalUnits - inventory.reservedUnits

    if (available < quantity) {
      throw new Error('INSUFFICIENT_STOCK')
    }

    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reservedUnits: {
          increment: quantity,
        },
      },
    })

    const expiresAt = new Date(
      Date.now() +
        RESERVATION_DURATION_MINUTES * 60 * 1000,
    )

    const reservation =
      await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: 'PENDING',
          expiresAt,
        },
      })

    return reservation
  })
}