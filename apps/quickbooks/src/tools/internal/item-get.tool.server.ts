// src/tools/internal/item-get.tool.server.ts

import { executeItem } from '../../blocks/quickbooks/resources/item/item-execute.server'

export default async function itemGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeItem('get', input as Record<string, any>)
}
