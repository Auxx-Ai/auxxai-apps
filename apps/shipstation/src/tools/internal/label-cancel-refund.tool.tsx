// src/tools/internal/label-cancel-refund.tool.tsx

import { defineTool, z } from '@auxx/sdk/tools'
import shipstationIcon from '../../assets/icon.png'
import labelCancelRefundExecute from './label-cancel-refund.tool.server'

/**
 * Withdraws a refund that voiding scheduled, leaving the postage charged.
 *
 * The counterpart to `label.void`: voiding a paid label REQUESTS a refund, and
 * the API models that request as a state a label sits in ("request_scheduled")
 * rather than something that settles immediately. This pulls it back out of
 * that state. Only a label still in it can be cancelled.
 *
 * Block-internal: no `agent` surface, so it costs an agent nothing and is only
 * reachable through `shipstation.server.ts`, which checks the installation's
 * capabilities before dispatching here.
 */
export const labelCancelRefundTool = defineTool({
  id: 'block_shipstation_label_cancel_refund',
  name: 'ShipStation label cancel refund (block-internal)',
  description: 'Internal tool backing the ShipStation workflow block. Not exposed to agents.',
  icon: shipstationIcon,
  // The block forwards its flat, `label`-prefixed input unchanged, so there is
  // no per-operation projection to re-declare here.
  inputs: z.object({}).passthrough(),
  outputs: z.object({}).passthrough(),
  config: { requiresConnection: true, timeout: 20000 },
  execute: labelCancelRefundExecute,
})
