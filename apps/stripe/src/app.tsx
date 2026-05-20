import { TextBlock } from '@auxx/sdk/client'
import { stripeBlock } from './blocks/stripe/stripe.workflow'
import { addStripeCustomerCardTool } from './tools/add-stripe-customer-card.tool'
import { cancelStripeSubscriptionTool } from './tools/cancel-stripe-subscription.tool'
import { createStripeCouponTool } from './tools/create-stripe-coupon.tool'
import { createStripeCustomerTool } from './tools/create-stripe-customer.tool'
import { findStripeCustomerTool } from './tools/find-stripe-customer.tool'
import { getStripeAccountTool } from './tools/get-stripe-account.tool'
import { getStripeChargeTool } from './tools/get-stripe-charge.tool'
import { getStripeCouponTool } from './tools/get-stripe-coupon.tool'
import { getStripeCustomerTool } from './tools/get-stripe-customer.tool'
import { getStripeCustomerCardTool } from './tools/get-stripe-customer-card.tool'
import { getStripeInvoiceTool } from './tools/get-stripe-invoice.tool'
import { getStripePaymentIntentTool } from './tools/get-stripe-payment-intent.tool'
import { getStripeRefundTool } from './tools/get-stripe-refund.tool'
import { getStripeSubscriptionTool } from './tools/get-stripe-subscription.tool'
import { balanceGetTool } from './tools/internal/balance-get.tool'
import { chargeCreateTool } from './tools/internal/charge-create.tool'
import { chargeGetTool } from './tools/internal/charge-get.tool'
import { chargeGetManyTool } from './tools/internal/charge-get-many.tool'
import { chargeUpdateTool } from './tools/internal/charge-update.tool'
import { couponCreateTool } from './tools/internal/coupon-create.tool'
import { couponGetManyTool } from './tools/internal/coupon-get-many.tool'
import { customerCardAddTool } from './tools/internal/customer-card-add.tool'
import { customerCardGetTool } from './tools/internal/customer-card-get.tool'
import { customerCardRemoveTool } from './tools/internal/customer-card-remove.tool'
import { customerCreateTool } from './tools/internal/customer-create.tool'
import { customerDeleteTool } from './tools/internal/customer-delete.tool'
import { customerGetTool } from './tools/internal/customer-get.tool'
import { customerGetManyTool } from './tools/internal/customer-get-many.tool'
import { customerUpdateTool } from './tools/internal/customer-update.tool'
import { sourceCreateTool } from './tools/internal/source-create.tool'
import { sourceDeleteTool } from './tools/internal/source-delete.tool'
import { sourceGetTool } from './tools/internal/source-get.tool'
import { tokenCreateTool } from './tools/internal/token-create.tool'
import { issueStripeRefundTool } from './tools/issue-stripe-refund.tool'
import { listStripeChargesTool } from './tools/list-stripe-charges.tool'
import { listStripeChargesForCustomerTool } from './tools/list-stripe-charges-for-customer.tool'
import { listStripeCouponsTool } from './tools/list-stripe-coupons.tool'
import { listStripeCustomerCardsTool } from './tools/list-stripe-customer-cards.tool'
import { listStripeInvoicesForCustomerTool } from './tools/list-stripe-invoices-for-customer.tool'
import { listStripePaymentIntentsForCustomerTool } from './tools/list-stripe-payment-intents-for-customer.tool'
import { listStripePricesTool } from './tools/list-stripe-prices.tool'
import { listStripeProductsTool } from './tools/list-stripe-products.tool'
import { listStripeRefundsForChargeTool } from './tools/list-stripe-refunds-for-charge.tool'
import { listStripeSubscriptionsForCustomerTool } from './tools/list-stripe-subscriptions-for-customer.tool'
import { removeStripeCustomerCardTool } from './tools/remove-stripe-customer-card.tool'
import { searchStripeCustomersTool } from './tools/search-stripe-customers.tool'
import { sendStripeInvoiceTool } from './tools/send-stripe-invoice.tool'
import { stripeToolsets } from './tools/toolsets'
import { updateStripeCustomerTool } from './tools/update-stripe-customer.tool'

export const app = {
  record: {
    actions: [],
    bulkActions: [],
    widgets: [],
  },
  callRecording: {
    insight: { textActions: [] },
    summary: { textActions: [] },
    transcript: { textActions: [] },
  },
  workflow: {
    blocks: [stripeBlock],
    triggers: [],
  },
  tools: [
    // Discovery (toolset-less; auto-attached by the platform bridge)
    getStripeAccountTool,
    listStripeProductsTool,
    listStripePricesTool,

    // Customers
    findStripeCustomerTool,
    getStripeCustomerTool,
    searchStripeCustomersTool,
    createStripeCustomerTool,
    updateStripeCustomerTool,

    // Charges
    getStripeChargeTool,
    listStripeChargesForCustomerTool,
    listStripeChargesTool,

    // Refunds (issue_stripe_refund also surfaces as a ticket-header action)
    getStripeRefundTool,
    listStripeRefundsForChargeTool,
    issueStripeRefundTool,

    // Payment intents
    getStripePaymentIntentTool,
    listStripePaymentIntentsForCustomerTool,

    // Subscriptions
    getStripeSubscriptionTool,
    listStripeSubscriptionsForCustomerTool,
    cancelStripeSubscriptionTool,

    // Invoices
    getStripeInvoiceTool,
    listStripeInvoicesForCustomerTool,
    sendStripeInvoiceTool,

    // Coupons (create_stripe_coupon also surfaces as a ticket-header action)
    listStripeCouponsTool,
    getStripeCouponTool,
    createStripeCouponTool,

    // Customer cards
    listStripeCustomerCardsTool,
    getStripeCustomerCardTool,
    addStripeCustomerCardTool,
    removeStripeCustomerCardTool,

    // Internal-only tools (dispatched by the Stripe workflow block)
    balanceGetTool,
    chargeCreateTool,
    chargeGetTool,
    chargeGetManyTool,
    chargeUpdateTool,
    couponCreateTool,
    couponGetManyTool,
    customerCreateTool,
    customerDeleteTool,
    customerGetTool,
    customerGetManyTool,
    customerUpdateTool,
    customerCardAddTool,
    customerCardGetTool,
    customerCardRemoveTool,
    sourceCreateTool,
    sourceDeleteTool,
    sourceGetTool,
    tokenCreateTool,
  ],
  toolsets: stripeToolsets,
}

export function App() {
  return (
    <>
      <TextBlock align="center">Stripe</TextBlock>
      <TextBlock align="left">
        Manage customers, charges, coupons, and payment methods through Stripe. Connect your Stripe
        account with a secret API key to get started.
      </TextBlock>
    </>
  )
}
