// src/tools/internal/metafield-get.tool.server.ts

import { executeMetafield } from '../../blocks/shopify/resources/metafield/metafield-execute.server'

export default async function metafieldGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMetafield('get', input)
}
