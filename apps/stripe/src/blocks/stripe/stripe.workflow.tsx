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

/**
 * Dispatcher table: `<resource>.<operation>` -> internal tool id. The runtime
 * reads this from the catalog and routes block executes through the unified
 * `__AUXX_TOOLS__` registry. See impl plan §6.3 / §7.4 and the migration recipe
 * in `plans/kopilot/agents/triggers/app-surface-per-app-migration.md` §2.5.
 * Keep this in sync with `resources/constants.ts` (`VALID_OPERATIONS`).
 */
export const stripeBlockToolMap: Record<string, string> = {
  'balance.get': 'block_stripe_balance_get',
  'charge.create': 'block_stripe_charge_create',
  'charge.get': 'block_stripe_charge_get',
  'charge.getMany': 'block_stripe_charge_get_many',
  'charge.update': 'block_stripe_charge_update',
  'coupon.create': 'block_stripe_coupon_create',
  'coupon.getMany': 'block_stripe_coupon_get_many',
  'customer.create': 'block_stripe_customer_create',
  'customer.delete': 'block_stripe_customer_delete',
  'customer.get': 'block_stripe_customer_get',
  'customer.getMany': 'block_stripe_customer_get_many',
  'customer.update': 'block_stripe_customer_update',
  'customerCard.add': 'block_stripe_customer_card_add',
  'customerCard.get': 'block_stripe_customer_card_get',
  'customerCard.remove': 'block_stripe_customer_card_remove',
  'source.create': 'block_stripe_source_create',
  'source.delete': 'block_stripe_source_delete',
  'source.get': 'block_stripe_source_get',
  'token.create': 'block_stripe_token_create',
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
  toolMap: stripeBlockToolMap,
} satisfies WorkflowBlock<typeof stripeSchema> & {
  toolMap: Record<string, string>
}
