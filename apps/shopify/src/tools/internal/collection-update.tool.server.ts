// src/tools/internal/collection-update.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('update', input)
}
