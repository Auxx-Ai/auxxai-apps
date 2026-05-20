// src/tools/internal/vendor-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import quickbooksIcon from '../../assets/icon.png'
import vendorUpdateExecute from './vendor-update.tool.server'

export const quickbooksVendorUpdateTool = defineTool({
  id: 'block_quickbooks_vendor_update',
  name: 'QuickBooks: update vendor (block-internal)',
  description: 'Internal tool backing the QuickBooks workflow block. Not exposed to agents.',
  icon: quickbooksIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: vendorUpdateExecute,
})
