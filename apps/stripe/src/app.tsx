import { TextBlock } from '@auxx/sdk/client'
import { stripeBlock } from './blocks/stripe/stripe.workflow'

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
