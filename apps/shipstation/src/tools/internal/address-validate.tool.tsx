// src/tools/internal/address-validate.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import addressValidateExecute from './address-validate.tool.server'

/**
 * ShipStation address validate (block-internal).
 *
 * Block-internal, so it carries NO `agent` surface: the workflow dispatcher
 * reaches it by id through `shipstation-tool-map.ts`, and a tool without an
 * agent surface costs an agent nothing, which is what makes 23 operations
 * affordable. Inputs and outputs pass through unvalidated because the block
 * forwards its flat, operation-prefixed input unchanged.
 */
export const addressValidateTool = defineTool({
  id: 'block_shipstation_address_validate',
  name: 'ShipStation address validate (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 15000 },
  execute: addressValidateExecute,
})
