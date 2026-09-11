// src/tools/internal/label-create-return.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import labelCreateReturnExecute from './label-create-return.tool.server'

/**
 * Creates a return label for an existing outbound label.
 *
 * Block-internal: no `agent` surface, so it costs an agent nothing and is only
 * reachable through `shipstation.server.ts`, which checks the installation's
 * capabilities before dispatching here.
 */
export const labelCreateReturnTool = defineTool({
  id: 'block_shipstation_label_create_return',
  name: 'ShipStation label createReturn (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  // The block forwards its flat, `label`-prefixed input unchanged, so there is
  // no per-operation projection to re-declare here.
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 30000 },
  execute: labelCreateReturnExecute,
})
