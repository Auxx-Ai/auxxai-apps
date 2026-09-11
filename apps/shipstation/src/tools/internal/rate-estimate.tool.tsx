// src/tools/internal/rate-estimate.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import rateEstimateExecute from './rate-estimate.tool.server'

/**
 * `rate.estimate` for the ShipStation workflow block. No agent surface.
 *
 * Idempotent: `POST /v2/rates/estimate` is a POST only because its input is a
 * body, and it persists nothing. The rate shop next door is a different story.
 */
export const rateEstimateTool = defineTool({
  id: 'block_shipstation_rate_estimate',
  name: 'ShipStation rate estimate (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 30000 },
  execute: rateEstimateExecute,
})
