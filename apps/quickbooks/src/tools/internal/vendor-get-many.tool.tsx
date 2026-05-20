// src/tools/internal/vendor-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import vendorGetManyExecute from './vendor-get-many.tool.server'

export const quickbooksVendorGetManyTool = defineTool({
  id: 'block_quickbooks_vendor_get_many',
  name: 'QuickBooks: get many vendors (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: vendorGetManyExecute,
})
