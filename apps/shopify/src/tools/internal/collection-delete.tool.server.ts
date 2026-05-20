// src/tools/internal/collection-delete.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('delete', input)
}
