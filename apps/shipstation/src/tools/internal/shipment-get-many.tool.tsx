// src/tools/internal/shipment-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentGetManyExecute from './shipment-get-many.tool.server'

export const shipmentGetManyTool = defineTool({
  id: 'block_shipstation_shipment_get_many',
  name: 'ShipStation shipment getMany (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: shipmentGetManyExecute,
})
