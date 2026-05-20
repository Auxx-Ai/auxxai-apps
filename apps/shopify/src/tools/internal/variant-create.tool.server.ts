// src/tools/internal/variant-create.tool.server.ts

import { executeVariant } from '../../blocks/shopify/resources/variant/variant-execute.server'

export default async function variantCreateExecute(
  input: Record<string, any>
): Promise<Record<string, any>> {
  return executeVariant('create', input)
}
