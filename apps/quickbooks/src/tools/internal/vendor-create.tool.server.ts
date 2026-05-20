// src/tools/internal/vendor-create.tool.server.ts

import { executeVendor } from '../../blocks/quickbooks/resources/vendor/vendor-execute.server'

export default async function vendorCreate(
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return executeVendor('create', input as Record<string, any>)
}
