// src/tools/internal/tracking-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import trackingGetExecute from './tracking-get.tool.server'

/**
 * `tracking.get` for the ShipStation workflow block.
 *
 * No `agent` surface: this is reachable only through the block dispatcher. A
 * tool without an agent surface costs an agent nothing, which is what makes 23
 * block operations affordable. The agent-facing tracking lookup is a separate,
 * deliberately shaped tool under `src/tools/`.
 *
 * Inputs and outputs are `passthrough` because the block forwards its flat,
 * operation-prefixed input unchanged; a per-operation projection here would be
 * a second copy of the schema to keep in step.
 */
export const trackingGetTool = defineTool({
  id: 'block_shipstation_tracking_get',
  name: 'ShipStation tracking get (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: trackingGetExecute,
})
