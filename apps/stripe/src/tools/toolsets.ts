// src/tools/toolsets.ts

import type { Toolset } from '@auxx/sdk/tools'

/**
 * Toolsets exposed by Stripe. Per-resource read/write split per
 * plans/kopilot/apps/stripe-overhaul.md §5. Three discovery tools
 * (get_stripe_account, list_stripe_products, list_stripe_prices)
 * are intentionally toolset-less — the platform bridge auto-attaches
 * them when any `stripe.*` toolset is enabled.
 */
export const stripeToolsets: Toolset[] = [
  // Customers — read/write split (delete deferred to workflow block)
  {
    id: 'stripe.customers.read',
    name: 'Stripe customers (read)',
    description:
      'Look up Stripe customers by email, fetch full customer detail, search across the account. Customer results carry an Auxx contact ref when imported.',
    tools: ['find_stripe_customer', 'get_stripe_customer', 'search_stripe_customers'],
  },
  {
    id: 'stripe.customers.write',
    name: 'Stripe customers (write)',
    description:
      'Create and update Stripe customers. Does not include delete — that lives in the workflow block.',
    tools: ['create_stripe_customer', 'update_stripe_customer'],
  },

  // Charges — read-only
  {
    id: 'stripe.charges.read',
    name: 'Stripe charges (read)',
    description:
      "Look up charges by id, list a customer's charges, or list recent charges across the account.",
    tools: ['get_stripe_charge', 'list_stripe_charges_for_customer', 'list_stripe_charges'],
  },

  // Refunds — split
  {
    id: 'stripe.refunds.read',
    name: 'Stripe refunds (read)',
    description: 'Look up refunds and list refunds for a charge.',
    tools: ['get_stripe_refund', 'list_stripe_refunds_for_charge'],
  },
  {
    id: 'stripe.refunds.write',
    name: 'Stripe refunds (write — destructive)',
    description:
      'Issue a full or partial refund against a Stripe charge. Selection is the approval — only enable for agents authorized to move money.',
    tools: ['issue_stripe_refund'],
  },

  // Payment intents — read-only
  {
    id: 'stripe.payment-intents.read',
    name: 'Stripe payment intents (read)',
    description:
      "Look up payment intents and list a customer's payment intents. PaymentIntent is the modern Stripe payment object — prefer this over Charge for accounts using Stripe Checkout or Elements.",
    tools: ['get_stripe_payment_intent', 'list_stripe_payment_intents_for_customer'],
  },

  // Subscriptions — split (cancel is destructive)
  {
    id: 'stripe.subscriptions.read',
    name: 'Stripe subscriptions (read)',
    description: "Look up subscriptions and list a customer's subscriptions.",
    tools: ['get_stripe_subscription', 'list_stripe_subscriptions_for_customer'],
  },
  {
    id: 'stripe.subscriptions.write',
    name: 'Stripe subscriptions (write — destructive)',
    description:
      'Cancel a subscription (immediate or at period end). Selection is the approval — only enable for agents authorized to end recurring revenue.',
    tools: ['cancel_stripe_subscription'],
  },

  // Invoices — split (send is externally visible)
  {
    id: 'stripe.invoices.read',
    name: 'Stripe invoices (read)',
    description: "Look up invoices and list a customer's invoices.",
    tools: ['get_stripe_invoice', 'list_stripe_invoices_for_customer'],
  },
  {
    id: 'stripe.invoices.write',
    name: 'Stripe invoices (write — sends email)',
    description:
      'Send an open or draft invoice to the customer (emails them). Selection is the approval — externally visible side effect.',
    tools: ['send_stripe_invoice'],
  },

  // Coupons — split (additive create)
  {
    id: 'stripe.coupons.read',
    name: 'Stripe coupons (read)',
    description: 'List and inspect Stripe coupons.',
    tools: ['list_stripe_coupons', 'get_stripe_coupon'],
  },
  {
    id: 'stripe.coupons.write',
    name: 'Stripe coupons (write)',
    description: 'Create a new Stripe coupon (percent or fixed-amount).',
    tools: ['create_stripe_coupon'],
  },

  // Customer cards — split (remove is destructive)
  {
    id: 'stripe.customer-cards.read',
    name: 'Stripe customer cards (read)',
    description: 'List and inspect cards on a Stripe customer.',
    tools: ['list_stripe_customer_cards', 'get_stripe_customer_card'],
  },
  {
    id: 'stripe.customer-cards.write',
    name: 'Stripe customer cards (write — destructive)',
    description:
      'Add a tokenized card to a customer, or remove an existing card. Selection is the approval — payment-method changes can break recurring revenue.',
    tools: ['add_stripe_customer_card', 'remove_stripe_customer_card'],
  },
]
