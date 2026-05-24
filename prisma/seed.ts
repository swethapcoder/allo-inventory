import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.reservation.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.product.deleteMany()
  await prisma.warehouse.deleteMany()

  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Hyderabad Warehouse',
    },
  })

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Bangalore Warehouse',
    },
  })

  const product1 = await prisma.product.create({
    data: {
      name: 'iPhone 15',
    },
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Samsung S24',
    },
  })

  await prisma.inventory.createMany({
    data: [
      {
        productId: product1.id,
        warehouseId: warehouse1.id,
        totalUnits: 10,
      },
      {
        productId: product1.id,
        warehouseId: warehouse2.id,
        totalUnits: 5,
      },
      {
        productId: product2.id,
        warehouseId: warehouse1.id,
        totalUnits: 8,
      },
    ],
  })

  console.log('Seed data inserted')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })