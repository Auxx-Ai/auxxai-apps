import { TextBlock } from '@auxx/sdk/client'
import { shopifyBlock } from './blocks/shopify/shopify.workflow'
import { shopifyTrigger } from './blocks/shopify/triggers/shopify-trigger/shopify-trigger.workflow'

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
    blocks: [shopifyBlock],
    triggers: [shopifyTrigger],
  },
}

export function App() {
  return (
    <>
      <TextBlock align="center">Shopify</TextBlock>
      <TextBlock align="left">
        Manage orders and products in your Shopify store. Connect your store via OAuth to get
        started.
      </TextBlock>
    </>
  )
}
