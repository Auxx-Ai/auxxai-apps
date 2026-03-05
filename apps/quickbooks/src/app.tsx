import { TextBlock } from '@auxx/sdk/client'
import { quickbooksBlock } from './blocks/quickbooks/quickbooks.workflow'

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
    blocks: [quickbooksBlock],
    triggers: [],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">QuickBooks</TextBlock>
      <TextBlock align="left">
        Connect your QuickBooks Online account to automate accounting workflows. Manage customers,
        invoices, payments, estimates, bills, and more directly from your Auxx workflows.
      </TextBlock>
    </>
  )
}
