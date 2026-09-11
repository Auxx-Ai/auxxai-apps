// src/tools/internal/shipment-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentGetExecute from './shipment-get.tool.server'

export const shipmentGetTool = defineTool({
  id: 'block_shipstation_shipment_get',
  name: 'ShipStation shipment get (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: shipmentGetExecute,
})
