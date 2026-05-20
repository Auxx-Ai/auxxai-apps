// src/tools/internal/metafield-delete.tool.server.ts

import { executeMetafield } from '../../blocks/shopify/resources/metafield/metafield-execute.server'

export default async function metafieldDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMetafield('delete', input)
}
