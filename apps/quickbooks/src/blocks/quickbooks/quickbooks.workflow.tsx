import { type WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeRow,
  WorkflowNodeText,
  WorkflowNodeHandle,
  useWorkflowNode,
} from '@auxx/sdk/client'
import quickbooksIcon from '../../assets/icon.png'
import quickbooksExecute from './quickbooks.server'
import { QuickBooksPanel } from './quickbooks-panel'
import { quickbooksSchema } from './quickbooks-schema'

export { quickbooksSchema }

const RESOURCE_LABELS: Record<string, string> = {
  bill: 'Bill',
  customer: 'Customer',
  employee: 'Employee',
  estimate: 'Estimate',
  invoice: 'Invoice',
  item: 'Item',
  payment: 'Payment',
  purchase: 'Purchase',
  transaction: 'Transaction',
  vendor: 'Vendor',
}

const OPERATION_LABELS: Record<string, string> = {
  create: 'Create',
  delete: 'Delete',
  get: 'Get',
  getMany: 'Get Many',
  getReport: 'Get Report',
  send: 'Send',
  update: 'Update',
  void: 'Void',
}

function QuickBooksNode() {
  const { data, status, lastRun } = useWorkflowNode()

  const resource = data.resource as string
  const operation = data.operation as string
  const resourceLabel = RESOURCE_LABELS[resource] || 'QuickBooks'
  const operationLabel = OPERATION_LABELS[operation] || ''

  const label = operationLabel ? `${operationLabel} ${resourceLabel}` : 'QuickBooks'

  return (
    <WorkflowNode>
      <WorkflowNodeHandle type="target" id="target" position="left" />

      <WorkflowNodeRow label={label} />

      {status === 'error' && lastRun?.error && (
        <WorkflowNodeText className="text-xs text-destructive">
          Error: {lastRun.error.message}
        </WorkflowNodeText>
      )}

      <WorkflowNodeHandle type="source" id="source" position="right" />
    </WorkflowNode>
  )
}

export const quickbooksBlock = {
  id: 'quickbooks',
  label: 'QuickBooks',
  description: 'Interact with QuickBooks Online — manage invoices, customers, payments, and more',
  category: 'action',
  icon: quickbooksIcon,
  color: '#2CA01C',
  schema: quickbooksSchema,
  node: QuickBooksNode,
  panel: QuickBooksPanel,
  execute: quickbooksExecute,
  config: {
    timeout: 30000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof quickbooksSchema>
