import type { WorkflowBlock } from '@auxx/sdk'
import {
  WorkflowNode,
  WorkflowNodeHandle,
  WorkflowNodeRow,
  WorkflowNodeText,
  useWorkflowNode,
} from '@auxx/sdk/client'
import stripeIcon from '../../assets/icon.png'
import { StripePanel } from './stripe-panel'
import { stripeSchema } from './stripe-schema'
import stripeExecute from './stripe.server'

export { stripeSchema }

function StripeNode() {
  const { data, status, lastRun } = useWorkflowNode()

  let label = 'Stripe'

  if (data.resource === 'balance') {
    label = 'Get Balance'
  } else if (data.resource === 'charge') {
    switch (data.operation) {
      case 'create':
        label = 'Create Charge'
        break
      case 'get':
        label = 'Get Charge'
        break
      case 'getMany':
        label = 'Get Charges'
        break
      case 'update':
        label = 'Update Charge'
        break
    }
  } else if (data.resource === 'coupon') {
    switch (data.operation) {
      case 'create':
        label = 'Create Coupon'
        break
      case 'getMany':
        label = 'Get Coupons'
        break
    }
  } else if (data.resource === 'customer') {
    switch (data.operation) {
      case 'create':
        label = 'Create Customer'
        break
      case 'delete':
        label = 'Delete Customer'
        break
      case 'get':
        label = 'Get Customer'
        break
      case 'getMany':
        label = 'Get Customers'
        break
      case 'update':
        label = 'Update Customer'
        break
    }
  } else if (data.resource === 'customerCard') {
    switch (data.operation) {
      case 'add':
        label = 'Add Card'
        break
      case 'get':
        label = 'Get Card'
        break
      case 'remove':
        label = 'Remove Card'
        break
    }
  } else if (data.resource === 'source') {
    switch (data.operation) {
      case 'create':
        label = 'Create Source'
        break
      case 'delete':
        label = 'Delete Source'
        break
      case 'get':
        label = 'Get Source'
        break
    }
  } else if (data.resource === 'token') {
    label = 'Create Token'
  }

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

export const stripeBlock = {
  id: 'stripe',
  label: 'Stripe',
  description: 'Interact with Stripe — manage customers, charges, coupons, and more',
  category: 'action',
  icon: stripeIcon,
  color: '#635BFF',
  schema: stripeSchema,
  node: StripeNode,
  panel: StripePanel,
  execute: stripeExecute,
  config: {
    timeout: 15000,
    retries: 1,
    requiresConnection: true,
  },
} satisfies WorkflowBlock<typeof stripeSchema>
