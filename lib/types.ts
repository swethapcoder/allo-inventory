// types.ts
export type StockWithWarehouse = {
  warehouseId: string
  warehouseName: string
  warehouseLocation?: string   // optional – your schema has no location
  totalUnits: number
  reservedUnits: number
  availableUnits: number
}

export type ProductWithStock = {
  id: string
  name: string
  sku?: string                 // optional – your schema has no sku
  description?: string
  priceInCents?: number        // optional – no price in schema
  stocks: StockWithWarehouse[]
}