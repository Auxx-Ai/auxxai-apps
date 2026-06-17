// src/tools/ups-block-watch.tool.tsx

/**
 * Internal-only tool — backs the UPS block's `shipment.watch` op. No `agent` /
 * `action` surface: invoked solely via the block dispatcher.
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import upsBlockWatchExecute from './ups-block-watch.tool.server'
import { blockWatchInputs, blockWatchOutputs } from './shared/block-io'

export const upsBlockWatchTool = defineTool({
  id: 'ups_block_watch',
  name: 'UPS: watch shipment (block)',
  description: 'Internal — backs the UPS block shipment.watch operation.',
  icon,
  inputs: blockWatchInputs,
  outputs: blockWatchOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: upsBlockWatchExecute,
})
