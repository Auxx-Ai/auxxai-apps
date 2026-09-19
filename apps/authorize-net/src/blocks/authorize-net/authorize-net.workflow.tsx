// src/blocks/authorize-net/authorize-net.workflow.tsx

import { type WorkflowBlock } from '@auxx/sdk'
import {
  useWorkflowNode,
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
} from '@auxx/sdk/client'
import authorizeNetIcon from '../../assets/authorize-net.png'
import { AuthorizeNetPanel } from './authorize-net-panel'
import { authorizeNetSchema } from './authorize-net-schema'
import { authorizeNetToolMap } from './authorize-net-tool-map'
import authorizeNetExecute from './authorize-net.server'

export { authorizeNetSchema }

/** Node captions. Keyed the same way as the tool map, so a gap is visible. */
const RESOURCE_LABELS: Record<string, Record<string, string>> = {
  batch: {
    getMany: 'List Settled Batches',
    getTransactions: 'List Batch Transactions',
  },
  transaction: {
    get: 'Get Transaction',
    getUnsettled: 'List Unsettled',
  },
}

function AuthorizeNetNode() {
  const { data } = useWorkflowNode()

  const resource = data?.resource as string
  const operation = data?.operation as string
  const label = RESOURCE_LABELS[resource]?.[operation] || 'Authorize.net'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />
      <WorkflowNodeRow label={label} />
      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const authorizeNetBlock = {
  id: 'authorize-net',
  label: 'Authorize.net',
  description:
    'Authorize.net settled batches and the transactions behind them. List what the acquirer ' +
    'deposited, open one batch to see its charges and refunds, look up a transaction for the ' +
    'invoice number that ties it back to an order, and see what is captured but not yet ' +
    'settled. Amounts are gross: card fees arrive on a monthly statement, not on the wire. ' +
    'Read-only — nothing here captures, refunds or voids a payment.',
  category: 'action',
  icon: authorizeNetIcon,
  color: '#1B5E9E',
  schema: authorizeNetSchema,
  node: AuthorizeNetNode,
  panel: AuthorizeNetPanel,
  execute: authorizeNetExecute,
  config: {
    timeout: 30000,
    // Safe to retry: every operation is a read and none of them spends anything.
    retries: 1,
    requiresConnection: true,
  },
  toolMap: authorizeNetToolMap,
} satisfies WorkflowBlock<typeof authorizeNetSchema>
