// src/blocks/shipstation/shared/list-warehouses.server.ts

import { shipstationApi } from '../../../tools/shared/shipstation-api'
import { getShipstationApiKey } from '../../../tools/shared/connection'

interface WarehouseListResponse {
  warehouses?: { warehouse_id?: string; name?: string; is_default?: boolean }[]
}

/**
 * Ship-from warehouses, for the panel's origin picker.
 *
 * These are `/v2/warehouses` (ship-from addresses), NOT
 * `/v2/inventory_warehouses`. The inventory suite is deliberately out of scope
 * for this app: Auxx owns stock. See the plan §1 decision 2.
 */
export default async function listWarehouses(): Promise<{ value: string; label: string }[]> {
  const apiKey = getShipstationApiKey()
  const result = await shipstationApi<WarehouseListResponse>('/warehouses', apiKey)

  return (result.warehouses ?? [])
    .filter((warehouse) => !!warehouse.warehouse_id)
    .map((warehouse) => ({
      value: String(warehouse.warehouse_id),
      label: warehouse.is_default
        ? `${warehouse.name || warehouse.warehouse_id} (default)`
        : warehouse.name || String(warehouse.warehouse_id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
