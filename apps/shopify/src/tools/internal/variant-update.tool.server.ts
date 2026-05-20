// src/tools/internal/variant-update.tool.server.ts

import { executeVariant } from '../../blocks/shopify/resources/variant/variant-execute.server'

export default async function variantUpdateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeVariant('update', input)
}
