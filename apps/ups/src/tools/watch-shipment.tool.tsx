// src/tools/watch-shipment.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import { statusTypeEnum } from './shared/shipment-schema'
import watchShipmentExecute from './watch-shipment.tool.server'

export const watchShipmentTool = defineTool({
  id: 'watch_shipment',
  name: 'Watch UPS shipment',
  description:
    'Start watching a UPS shipment for status changes. Validates the number and returns its current status in the same turn, then registers it so the shipment-status-changed trigger fires on future updates (delivered, exception, …). Re-watching refreshes the 14-day expiry.',
  icon,
  inputs: z.object({
    trackingNumber: z.string().min(1).describe('UPS tracking number to watch.'),
    recordId: z
      .string()
      .optional()
      .describe(
        'Auxx ticket record id to link the shipment to — included in change events so downstream agents/workflows know which ticket to act on.'
      ),
  }),
  outputs: z.object({
    watched: z.boolean(),
    currentStatus: statusTypeEnum,
    expiresAt: z.string().describe('UTC ISO — when the watch expires unless refreshed.'),
  }),
  exampleOutput: {
    watched: true,
    currentStatus: 'in_transit',
    expiresAt: '2026-06-26T09:14:00Z',
  },
  config: { requiresConnection: true, timeout: 15000 },
  execute: watchShipmentExecute,
  agent: { toolsetSlug: 'ups.tracking' },
})
