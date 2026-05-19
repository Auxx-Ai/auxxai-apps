// src/tools/list-quickbooks-items.tool.server.ts

import { quickbooksQuery } from '../blocks/quickbooks/shared/quickbooks-api'
import { getQuickbooksConnection } from './shared/connection'
import { mapItemSummary, type ItemType } from './shared/map-item'

interface ListedItem {
  id: string
  name: string
  type: ItemType
  unitPrice: number | null
  description: string | null
  active: boolean
}

interface ListQuickbooksItemsOutput {
  items: ListedItem[]
}

export default async function listQuickbooksItems(): Promise<ListQuickbooksItemsOutput> {
  const { credential, realmId, sandbox } = await getQuickbooksConnection()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await quickbooksQuery<any>(realmId, 'Item', credential, {
    returnAll: true,
    sandbox,
  })

  const items: ListedItem[] = raw.map((r) => {
    const m = mapItemSummary(r)
    return {
      id: m.itemId,
      name: m.name,
      type: m.type,
      unitPrice: m.unitPrice,
      description: m.description,
      active: m.active,
    }
  })

  return { items }
}
