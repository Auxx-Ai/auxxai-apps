// src/tools/internal/shipment-update.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentUpdateExecute from './shipment-update.tool.server'

export const shipmentUpdateTool = defineTool({
  id: 'block_shipstation_shipment_update',
  name: 'ShipStation shipment update (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: shipmentUpdateExecute,
})
