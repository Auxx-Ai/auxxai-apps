// src/tools/fedex-block-unwatch.tool.tsx

/**
 * Internal-only tool — backs the FedEx block's `shipment.unwatch` op. No `agent` /
 * `action` surface: invoked solely via the block dispatcher.
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import fedexBlockUnwatchExecute from './fedex-block-unwatch.tool.server'
import { blockUnwatchInputs, blockUnwatchOutputs } from './shared/block-io'

export const fedexBlockUnwatchTool = defineTool({
  id: 'fedex_block_unwatch',
  name: 'FedEx: unwatch shipment (block)',
  description: 'Internal — backs the FedEx block shipment.unwatch operation.',
  icon,
  inputs: blockUnwatchInputs,
  outputs: blockUnwatchOutputs,
  config: { requiresConnection: true, timeout: 5000 },
  execute: fedexBlockUnwatchExecute,
})
