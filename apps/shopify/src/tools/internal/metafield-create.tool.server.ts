// src/tools/internal/metafield-create.tool.server.ts

import { executeMetafield } from '../../blocks/shopify/resources/metafield/metafield-execute.server'

export default async function metafieldCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeMetafield('create', input)
}
