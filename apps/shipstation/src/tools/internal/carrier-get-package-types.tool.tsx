// src/tools/internal/carrier-get-package-types.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import carrierGetPackageTypesExecute from './carrier-get-package-types.tool.server'

/**
 * ShipStation carrier getPackageTypes (block-internal).
 *
 * Block-internal, so it carries NO `agent` surface: the workflow dispatcher
 * reaches it by id through `shipstation-tool-map.ts`, and a tool without an
 * agent surface costs an agent nothing, which is what makes 23 operations
 * affordable. Inputs and outputs pass through unvalidated because the block
 * forwards its flat, operation-prefixed input unchanged.
 */
export const carrierGetPackageTypesTool = defineTool({
  id: 'block_shipstation_carrier_get_package_types',
  name: 'ShipStation carrier getPackageTypes (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: carrierGetPackageTypesExecute,
})
