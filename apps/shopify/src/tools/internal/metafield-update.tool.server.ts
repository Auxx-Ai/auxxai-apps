// src/tools/internal/metafield-update.tool.server.ts

import { executeMetafield } from '../../blocks/shopify/resources/metafield/metafield-execute.server'

export default async function metafieldUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMetafield('update', input)
}
