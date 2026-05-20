// src/tools/internal/vendor-update.tool.server.ts

import { executeVendor } from '../../blocks/quickbooks/resources/vendor/vendor-execute.server'

export default async function vendorUpdate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeVendor('update', input as Record<string, any>)
}
