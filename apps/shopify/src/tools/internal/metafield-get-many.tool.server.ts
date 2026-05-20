// src/tools/internal/metafield-get-many.tool.server.ts

import { executeMetafield } from '../../blocks/shopify/resources/metafield/metafield-execute.server'

export default async function metafieldGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMetafield('getMany', input)
}
