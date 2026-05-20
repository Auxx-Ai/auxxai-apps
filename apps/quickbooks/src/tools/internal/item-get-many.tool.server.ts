// src/tools/internal/item-get-many.tool.server.ts

import { executeItem } from '../../blocks/quickbooks/resources/item/item-execute.server'

export default async function itemGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeItem('getMany', input as Record<string, any>)
}
