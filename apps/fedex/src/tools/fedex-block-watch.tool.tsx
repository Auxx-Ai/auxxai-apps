// src/tools/fedex-block-watch.tool.tsx

/**
 * Internal-only tool — backs the FedEx block's `shipment.watch` op. No `agent` /
 * `action` surface: invoked solely via the block dispatcher.
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import fedexBlockWatchExecute from './fedex-block-watch.tool.server'
import { blockWatchInputs, blockWatchOutputs } from './shared/block-io'

export const fedexBlockWatchTool = defineTool({
  id: 'fedex_block_watch',
  name: 'FedEx: watch shipment (block)',
  description: 'Internal — backs the FedEx block shipment.watch operation.',
  icon,
  inputs: blockWatchInputs,
  outputs: blockWatchOutputs,
  config: { requiresConnection: true, timeout: 10000 },
  execute: fedexBlockWatchExecute,
})
