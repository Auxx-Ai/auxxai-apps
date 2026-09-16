// src/blocks/affirm/affirm.workflow.tsx

/**
 * The `affirm` workflow action block.
 *
 * Read-only, over the app's four existing read tools. The useful shapes it gives
 * a workflow author:
 *
 *  - *"What landed in the bank?"* — `settlement.getMany`, deposits in a window,
 *    each carrying the `deposit_id` the bank statement shows.
 *  - *"What is this deposit made of?"* — `settlement.getEvents`, the captures,
 *    refunds and fees inside one, with `complete` saying whether that is all of
 *    them.
 *  - *"Which Shopify order paid for this?"* — `charge.get`, which publishes
 *    `shopifyPaymentSessionId` as a top-level variable.
 *  - *"What did customers finance?"* — `charge.getMany`.
 */

import { type WorkflowBlock } from '@auxx/sdk'
import {
  useWorkflowNode,
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
} from '@auxx/sdk/client'
import affirmIcon from '../../assets/affirm.png'
import { AffirmPanel } from './affirm-panel'
import { affirmSchema } from './affirm-schema'
import { affirmToolMap } from './affirm-tool-map'
import affirmExecute from './affirm.server'

export { affirmSchema }

/** Node captions. Keyed the same way as the tool map, so a gap is visible. */
const RESOURCE_LABELS: Record<string, Record<string, string>> = {
  settlement: {
    getMany: 'List Affirm Deposits',
    getEvents: 'List Deposit Events',
  },
  charge: {
    getMany: 'List Affirm Charges',
    get: 'Get Affirm Charge',
  },
}

function AffirmNode() {
  const { data } = useWorkflowNode()

  const resource = data?.resource as string
  const operation = data?.operation as string
  const label = RESOURCE_LABELS[resource]?.[operation] || 'Affirm'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const affirmBlock = {
  id: 'affirm',
  label: 'Affirm',
  description:
    'Affirm deposits and the charges behind them. List the settlements that reached the bank, ' +
    'open one deposit to see the captures, refunds and fees inside it, and look up a charge to ' +
    'get the Shopify payment session it belongs to — which is how an Affirm deposit is tied back ' +
    'to a Shopify order. Read-only: nothing here captures, refunds or voids a loan.',
  category: 'action',
  icon: affirmIcon,
  // Affirm's own brand indigo.
  color: '#4A4AF4',
  schema: affirmSchema,
  node: AffirmNode,
  panel: AffirmPanel,
  execute: affirmExecute,
  config: {
    timeout: 30000,
    // Safe to retry, unlike ShipStation's block: every operation is a GET
    // against a read endpoint and none of them spends anything. A settlement
    // page read twice returns the same page.
    retries: 1,
    requiresConnection: true,
  },
  toolMap: affirmToolMap,
} satisfies WorkflowBlock<typeof affirmSchema>
