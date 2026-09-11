// src/tools/internal/shipment-add-note.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import shipmentAddNoteExecute from './shipment-add-note.tool.server'

export const shipmentAddNoteTool = defineTool({
  id: 'block_shipstation_shipment_add_note',
  name: 'ShipStation shipment addNote (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: shipmentAddNoteExecute,
})
