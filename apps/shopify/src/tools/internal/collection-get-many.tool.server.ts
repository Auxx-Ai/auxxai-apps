// src/tools/internal/collection-get-many.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('getMany', input)
}
