// src/tools/internal/shipment-cancel.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentCancelExecute from './shipment-cancel.tool.server'

export const shipmentCancelTool = defineTool({
  id: 'block_shipstation_shipment_cancel',
  name: 'ShipStation shipment cancel (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: shipmentCancelExecute,
})
