// src/tools/internal/rate-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import rateGetManyExecute from './rate-get-many.tool.server'

/**
 * `rate.getMany`, the full rate shop, for the ShipStation workflow block.
 * No agent surface.
 *
 * 🛑 NOT marked idempotent. `POST /v2/rates` with an inline shipment makes
 * ShipStation persist that shipment and answer with its id, so running it twice
 * leaves two shipments behind. It spends no money, but it is not a pure read.
 */
export const rateGetManyTool = defineTool({
  id: 'block_shipstation_rate_get_many',
  name: 'ShipStation rate getMany (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: rateGetManyExecute,
})
