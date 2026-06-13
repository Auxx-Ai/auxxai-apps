// src/tools/fedex-block-track.tool.tsx

/**
 * Internal-only tool — backs the FedEx block's `shipment.track` op. No `agent` /
 * `action` surface keys: invoked solely via the block dispatcher (`ctx.runTool`).
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import fedexBlockTrackExecute from './fedex-block-track.tool.server'
import { blockTrackInputs, flatShipmentOutputs } from './shared/block-io'

export const fedexBlockTrackTool = defineTool({
  id: 'fedex_block_track',
  name: 'FedEx: track by number (block)',
  description: 'Internal — backs the FedEx block shipment.track operation.',
  icon,
  inputs: blockTrackInputs,
  outputs: flatShipmentOutputs,
  config: { requiresConnection: true, idempotent: true, timeout: 10000 },
  execute: fedexBlockTrackExecute,
})
