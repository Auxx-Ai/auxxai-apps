// src/tools/internal/variant-get.tool.server.ts

import { executeVariant } from '../../blocks/shopify/resources/variant/variant-execute.server'

export default async function variantGetExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeVariant('get', input)
}
