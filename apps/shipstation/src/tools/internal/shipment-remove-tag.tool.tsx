// src/tools/internal/shipment-remove-tag.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentRemoveTagExecute from './shipment-remove-tag.tool.server'

export const shipmentRemoveTagTool = defineTool({
  id: 'block_shipstation_shipment_remove_tag',
  name: 'ShipStation shipment removeTag (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: shipmentRemoveTagExecute,
})
