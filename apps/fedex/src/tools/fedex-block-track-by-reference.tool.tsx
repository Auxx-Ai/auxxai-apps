// src/tools/fedex-block-track-by-reference.tool.tsx

/**
 * Internal-only tool — backs the FedEx block's `shipment.trackByReference` op.
 * No `agent` / `action` surface: invoked solely via the block dispatcher.
 */

import { defineTool } from '@auxx/sdk/tools'
import icon from '../assets/icon.png'
import fedexBlockTrackByReferenceExecute from './fedex-block-track-by-reference.tool.server'
import { blockTrackByReferenceInputs, flatShipmentOutputs } from './shared/block-io'

export const fedexBlockTrackByReferenceTool = defineTool({
  id: 'fedex_block_track_by_reference',
  name: 'FedEx: track by reference (block)',
  description: 'Internal — backs the FedEx block shipment.trackByReference operation.',
  icon,
  inputs: blockTrackByReferenceInputs,
  outputs: flatShipmentOutputs,
  config: { requiresConnection: true, idempotent: true, timeout: 10000 },
  execute: fedexBlockTrackByReferenceExecute,
})
