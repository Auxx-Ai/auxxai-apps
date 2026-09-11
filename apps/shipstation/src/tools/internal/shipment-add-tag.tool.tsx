// src/tools/internal/shipment-add-tag.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentAddTagExecute from './shipment-add-tag.tool.server'

export const shipmentAddTagTool = defineTool({
  id: 'block_shipstation_shipment_add_tag',
  name: 'ShipStation shipment addTag (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: shipmentAddTagExecute,
})
