// src/tools/internal/collection-create.tool.server.ts

import { executeCollection } from '../../blocks/shopify/resources/collection/collection-execute.server'

export default async function collectionCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeCollection('create', input)
}
