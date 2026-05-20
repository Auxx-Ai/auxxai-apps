// src/tools/internal/variant-get-many.tool.server.ts

import { executeVariant } from '../../blocks/shopify/resources/variant/variant-execute.server'

export default async function variantGetManyExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeVariant('getMany', input)
}
