// src/tools/unwatch-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import unwatchShipmentExecute from './unwatch-shipment.tool.server'

export const unwatchShipmentTool = defineTool({
  id: 'unwatch_shipment',
  name: 'Unwatch FedEx shipment',
  description:
    'Stop watching a FedEx shipment. Returns removed: false when the number was not being watched (not an error).',
  icon,
  inputs: z.object({
    trackingNumber: z.string().min(1).describe('FedEx tracking number to stop watching.'),
  }),
  outputs: z.object({
    removed: z.boolean(),
  }),
  exampleOutput: { removed: true },
  config: { requiresConnection: true, timeout: 5000 },
  execute: unwatchShipmentExecute,
  agent: { toolsetSlug: 'fedex.tracking' },
})
