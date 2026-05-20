// src/tools/internal/vendor-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import vendorGetExecute from './vendor-get.tool.server'

export const quickbooksVendorGetTool = defineTool({
  id: 'block_quickbooks_vendor_get',
  name: 'QuickBooks: get vendor (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: vendorGetExecute,
})
