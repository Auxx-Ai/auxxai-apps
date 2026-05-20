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

export const quickbooksBlockToolMap = {
  'bill.create': 'block_quickbooks_bill_create',
  'bill.delete': 'block_quickbooks_bill_delete',
  'bill.get': 'block_quickbooks_bill_get',
  'bill.getMany': 'block_quickbooks_bill_get_many',
  'bill.update': 'block_quickbooks_bill_update',
  'customer.create': 'block_quickbooks_customer_create',
  'customer.get': 'block_quickbooks_customer_get',
  'customer.getMany': 'block_quickbooks_customer_get_many',
  'customer.update': 'block_quickbooks_customer_update',
  'employee.create': 'block_quickbooks_employee_create',
  'employee.get': 'block_quickbooks_employee_get',
  'employee.getMany': 'block_quickbooks_employee_get_many',
  'employee.update': 'block_quickbooks_employee_update',
  'estimate.create': 'block_quickbooks_estimate_create',
  'estimate.delete': 'block_quickbooks_estimate_delete',
  'estimate.get': 'block_quickbooks_estimate_get',
  'estimate.getMany': 'block_quickbooks_estimate_get_many',
  'estimate.send': 'block_quickbooks_estimate_send',
  'estimate.update': 'block_quickbooks_estimate_update',
  'invoice.create': 'block_quickbooks_invoice_create',
  'invoice.delete': 'block_quickbooks_invoice_delete',
  'invoice.get': 'block_quickbooks_invoice_get',
  'invoice.getMany': 'block_quickbooks_invoice_get_many',
  'invoice.send': 'block_quickbooks_invoice_send',
  'invoice.update': 'block_quickbooks_invoice_update',
  'invoice.void': 'block_quickbooks_invoice_void',
  'item.get': 'block_quickbooks_item_get',
  'item.getMany': 'block_quickbooks_item_get_many',
  'payment.create': 'block_quickbooks_payment_create',
  'payment.delete': 'block_quickbooks_payment_delete',
  'payment.get': 'block_quickbooks_payment_get',
  'payment.getMany': 'block_quickbooks_payment_get_many',
  'payment.send': 'block_quickbooks_payment_send',
  'payment.update': 'block_quickbooks_payment_update',
  'payment.void': 'block_quickbooks_payment_void',
  'purchase.get': 'block_quickbooks_purchase_get',
  'purchase.getMany': 'block_quickbooks_purchase_get_many',
  'transaction.getReport': 'block_quickbooks_transaction_get_report',
  'vendor.create': 'block_quickbooks_vendor_create',
  'vendor.get': 'block_quickbooks_vendor_get',
  'vendor.getMany': 'block_quickbooks_vendor_get_many',
  'vendor.update': 'block_quickbooks_vendor_update',
} as const

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
  toolMap: quickbooksBlockToolMap,
} satisfies WorkflowBlock<typeof quickbooksSchema>
