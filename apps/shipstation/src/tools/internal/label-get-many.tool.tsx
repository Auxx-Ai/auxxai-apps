// src/tools/internal/label-get-many.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import labelGetManyExecute from './label-get-many.tool.server'

/**
 * Lists labels with every package tracking number, ordered by sequence.
 *
 * Block-internal: no `agent` surface, so it costs an agent nothing and is only
 * reachable through `shipstation.server.ts`, which checks the installation's
 * capabilities before dispatching here.
 */
export const labelGetManyTool = defineTool({
  id: 'block_shipstation_label_get_many',
  name: 'ShipStation label getMany (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  // The block forwards its flat, `label`-prefixed input unchanged, so there is
  // no per-operation projection to re-declare here.
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, idempotent: true, timeout: 20000 },
  execute: labelGetManyExecute,
})
