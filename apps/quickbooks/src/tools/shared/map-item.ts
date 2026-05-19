// src/tools/shared/map-item.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ItemType = 'Inventory' | 'Service' | 'NonInventory' | 'Group'

export interface MappedItemSummary {
  itemId: string
  name: string
  type: ItemType
  unitPrice: number | null
  description: string | null
  active: boolean
}

export interface MappedItemDetail extends MappedItemSummary {
  qtyOnHand: number | null
  syncToken: string
}

function normalizeType(t: unknown): ItemType {
  if (t === 'Inventory' || t === 'Service' || t === 'NonInventory' || t === 'Group') return t
  return 'Service'
}

export function mapItemSummary(item: any): MappedItemSummary {
  return {
    itemId: String(item.Id ?? ''),
    name: item.Name ?? '',
    type: normalizeType(item.Type),
    unitPrice:
      item.UnitPrice !== undefined && item.UnitPrice !== null ? Number(item.UnitPrice) : null,
    description: item.Description ?? null,
    active: item.Active !== false,
  }
}

export function mapItemDetail(item: any): MappedItemDetail {
  return {
    ...mapItemSummary(item),
    qtyOnHand:
      item.QtyOnHand !== undefined && item.QtyOnHand !== null ? Number(item.QtyOnHand) : null,
    syncToken: String(item.SyncToken ?? '0'),
  }
}
