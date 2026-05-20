// src/tools/internal/vendor-get-many.tool.server.ts

import { executeVendor } from '../../blocks/quickbooks/resources/vendor/vendor-execute.server'

export default async function vendorGetMany(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeVendor('getMany', input as Record<string, any>)
}
