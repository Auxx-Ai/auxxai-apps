// src/tools/internal/vendor-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import vendorCreateExecute from './vendor-create.tool.server'

export const quickbooksVendorCreateTool = defineTool({
  id: 'block_quickbooks_vendor_create',
  name: 'QuickBooks: create vendor (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: vendorCreateExecute,
})
