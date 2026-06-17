// src/tools/ups-block-unwatch.tool.tsx

/**
 * Internal-only tool — backs the UPS block's `shipment.unwatch` op. No `agent` /
 * `action` surface: invoked solely via the block dispatcher.
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import upsBlockUnwatchExecute from './ups-block-unwatch.tool.server'
import { blockUnwatchInputs, blockUnwatchOutputs } from './shared/block-io'

export const upsBlockUnwatchTool = defineTool({
  id: 'ups_block_unwatch',
  name: 'UPS: unwatch shipment (block)',
  description: 'Internal — backs the UPS block shipment.unwatch operation.',
  icon,
  inputs: blockUnwatchInputs,
  outputs: blockUnwatchOutputs,
  config: { requiresConnection: true, timeout: 5000 },
  execute: upsBlockUnwatchExecute,
})
