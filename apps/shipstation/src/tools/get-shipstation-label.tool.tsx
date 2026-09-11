// src/tools/get-shipstation-label.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../assets/icon.png'
import getShipstationLabelExecute from './get-shipstation-label.tool.server'
import { exampleLabel, labelSchema } from './shared/schemas'

export const getShipstationLabelTool = defineTool({
  id: 'get_shipstation_label',
  name: 'Get ShipStation label',
  description:
    'Get one ShipStation label in full detail by its label id: every package with its own tracking number, sequence, weight and dimensions. A multi-box label has a different tracking number per box, so list them all. Use list_shipstation_labels to find a label id first.',
  icon: shipstationIcon,
  inputs: z.object({
    labelId: z.string().describe('ShipStation label id, e.g. se-197559213.'),
  }),
  outputs: z.object({ label: labelSchema }),
  exampleOutput: { label: exampleLabel },
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: getShipstationLabelExecute,
  agent: { toolsetSlug: 'shipstation.read' },
})
