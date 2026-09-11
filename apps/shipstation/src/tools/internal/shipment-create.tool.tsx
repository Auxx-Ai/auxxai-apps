// src/tools/internal/shipment-create.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentCreateExecute from './shipment-create.tool.server'

export const shipmentCreateTool = defineTool({
  id: 'block_shipstation_shipment_create',
  name: 'ShipStation shipment create (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 20000 },
  execute: shipmentCreateExecute,
})
