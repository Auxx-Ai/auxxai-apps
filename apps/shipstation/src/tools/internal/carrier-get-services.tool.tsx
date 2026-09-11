// src/tools/internal/carrier-get-services.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import carrierGetServicesExecute from './carrier-get-services.tool.server'

/**
 * ShipStation carrier getServices (block-internal).
 *
 * Block-internal, so it carries NO `agent` surface: the workflow dispatcher
 * reaches it by id through `shipstation-tool-map.ts`, and a tool without an
 * agent surface costs an agent nothing, which is what makes 23 operations
 * affordable. Inputs and outputs pass through unvalidated because the block
 * forwards its flat, operation-prefixed input unchanged.
 */
export const carrierGetServicesTool = defineTool({
  id: 'block_shipstation_carrier_get_services',
  name: 'ShipStation carrier getServices (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: carrierGetServicesExecute,
})
