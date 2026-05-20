// src/tools/internal/vendor-get.tool.server.ts

import { executeVendor } from '../../blocks/quickbooks/resources/vendor/vendor-execute.server'

export default async function vendorGet(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeVendor('get', input as Record<string, any>)
}
