// src/tools/internal/label-get.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import labelGetExecute from './label-get.tool.server'

/**
 * Gets one label by label id or external shipment id, with every package.
 *
 * Block-internal: no `agent` surface, so it costs an agent nothing and is only
 * reachable through `shipstation.server.ts`, which checks the installation's
 * capabilities before dispatching here.
 */
export const labelGetTool = defineTool({
  id: 'block_shipstation_label_get',
  name: 'ShipStation label get (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  // The block forwards its flat, `label`-prefixed input unchanged, so there is
  // no per-operation projection to re-declare here.
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 15000 },
  execute: labelGetExecute,
})
