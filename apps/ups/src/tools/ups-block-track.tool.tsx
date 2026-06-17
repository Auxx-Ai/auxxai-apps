// src/tools/ups-block-track.tool.tsx

/**
 * Internal-only tool — backs the UPS block's `shipment.track` op. No `agent` /
 * `action` surface keys: invoked solely via the block dispatcher (`ctx.runTool`).
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import upsBlockTrackExecute from './ups-block-track.tool.server'
import { blockTrackInputs, flatShipmentOutputs } from './shared/block-io'

export const upsBlockTrackTool = defineTool({
  id: 'ups_block_track',
  name: 'UPS: track by number (block)',
  description: 'Internal — backs the UPS block shipment.track operation.',
  icon,
  inputs: blockTrackInputs,
  outputs: flatShipmentOutputs,
  config: { requiresConnection: true, idempotent: true, timeout: 10000 },
  execute: upsBlockTrackExecute,
})
