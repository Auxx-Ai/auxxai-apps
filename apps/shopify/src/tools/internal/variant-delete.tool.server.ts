// src/tools/internal/variant-delete.tool.server.ts

import { executeVariant } from '../../blocks/shopify/resources/variant/variant-execute.server'

export default async function variantDeleteExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeVariant('delete', input)
}
