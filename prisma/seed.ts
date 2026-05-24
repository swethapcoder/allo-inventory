import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding additional products...')

  // Get existing warehouses (Hyderabad and Bangalore)
  const warehouses = await prisma.warehouse.findMany()
  if (warehouses.length === 0) {
    // If no warehouses exist, create them
    await prisma.warehouse.createMany({
      data: [{ name: 'Hyderabad Warehouse' }, { name: 'Bangalore Warehouse' }],
    })
    const refreshed = await prisma.warehouse.findMany()
    warehouses.push(...refreshed)
  }

  const newProducts = [
    { name: 'Google Pixel 8' },
    { name: 'OnePlus 12' },
  ]

  for (const productData of newProducts) {
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: productData.name },
    })
    if (existing) {
      console.log(`Product ${productData.name} already exists, skipping.`)
      continue
    }

    // Create product
    const product = await prisma.product.create({
      data: { name: productData.name },
    })

    // Create inventory for each warehouse
    for (const warehouse of warehouses) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          warehouseId: warehouse.id,
          totalUnits: 10,
          reservedUnits: 0,
        },
      })
    }
    console.log(`Added ${productData.name} with inventory.`)
  }

  console.log('Seeding complete.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })