// src/tools/internal/collection-get.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('get', input)
}
