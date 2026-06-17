// src/record-actions/link-stripe-customer.tsx

import { type DialogComponent, type RecordAction, showDialog } from '@auxx/sdk/client'
import stripeIcon from '../assets/icon.png'
import { LinkStripeDialog } from './link-stripe-dialog'

/**
 * Record action that links a contact to its Stripe customer. Opens a dialog
 * that searches Stripe by the contact's email and writes the chosen customer id
 * onto the contact's `customerId` field.
 *
 * Shown on every record type (v1 has no host-side record-type gating); on a
 * record without an email the dialog renders the empty state.
 */
export const linkStripeCustomerAction: RecordAction = {
  id: 'link-stripe-customer',
  label: 'Link Stripe customer',
  icon: stripeIcon,
  description: 'Search Stripe by email and link this contact to a customer',
  async onTrigger({ recordId }) {
    await showDialog({
      title: 'Link Stripe customer',
      size: 'medium',
      Dialog: (({ hideDialog }) => (
        <LinkStripeDialog recordId={recordId} hideDialog={hideDialog} />
      )) as DialogComponent,
    })
  },
}
